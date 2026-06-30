import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, POST } from './route';
import { readAll, writeAll } from '../../../lib/store';

vi.mock('../../../lib/store', () => ({
  readAll: vi.fn(),
  writeAll: vi.fn(),
}));

function jsonRequest(method, body, headers = {}) {
  return new Request('http://localhost/api/feedback', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/feedback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_KEY = 'test-admin-key';
  });

  it('returns 400 for invalid feedback input', async () => {
    const response = await POST(jsonRequest('POST', { name: '', text: '' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid feedback');
    expect(writeAll).not.toHaveBeenCalled();
  });

  it('returns 201 and stores validated feedback', async () => {
    readAll.mockReturnValue([]);
    vi.spyOn(Date, 'now').mockReturnValue(12345);

    const response = await POST(jsonRequest('POST', {
      name: ' Ada ',
      text: ' Ship safer code ',
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      id: '12345',
      name: 'Ada',
      text: 'Ship safer code',
    });
    expect(writeAll).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '12345',
        name: 'Ada',
        text: 'Ship safer code',
      }),
    ]);
  });

  it('returns 403 when delete request is missing admin authorization', async () => {
    const response = await DELETE(jsonRequest('DELETE', { id: '1' }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
    expect(writeAll).not.toHaveBeenCalled();
  });

  it('deletes feedback with a valid admin bearer token', async () => {
    readAll.mockReturnValue([
      { id: '1', name: 'Ada', text: 'Keep this', createdAt: '2026-06-30T00:00:00.000Z' },
      { id: '2', name: 'Grace', text: 'Delete this', createdAt: '2026-06-30T00:00:00.000Z' },
    ]);

    const response = await DELETE(jsonRequest('DELETE', { id: '2' }, {
      Authorization: 'Bearer test-admin-key',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(writeAll).toHaveBeenCalledWith([
      { id: '1', name: 'Ada', text: 'Keep this', createdAt: '2026-06-30T00:00:00.000Z' },
    ]);
  });
});
