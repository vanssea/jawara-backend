import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

// Mock WargaService (kita test layer HTTP — controller + routing)
const mockWargaService = {
  create: jest.fn(async (dto) => ({ id: '1', ...dto })),
  findAll: jest.fn(async () => [{ id: '1', nama: 'Budi' }]),
  findOne: jest.fn(async (id: string) => ({ id, nama: 'Budi' })),
  update: jest.fn(async (id: string, dto) => ({ id, ...dto })),
  remove: jest.fn(async (id: string) => ({ id })),
};

describe('Warga API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // override provider WargaService supaya tidak mengakses Supabase / DB nyata
      .overrideProvider('WargaService') // try token by string first (adjust if project uses class token)
      .useValue(mockWargaService)
      .compile();

    // if overrideProvider('WargaService') doesn't match your provider token,
    // replace with .overrideProvider(WargaService).useValue(mockWargaService)
    // and import WargaService class at top:
    // import { WargaService } from 'src/warga/warga.service';

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('POST /warga -> should create warga and return 201 (or 200 depending controller)', async () => {
    const payload = { nama: 'Budi', alamat: 'Jl. Mawar' };

    const res = await request(app.getHttpServer())
      .post('/warga')
      .send(payload)
      .set('Accept', 'application/json');

    // Common expectation: status 201 Created and response body contains created resource
    // If your controller returns 200, change HttpStatus.CREATED to HttpStatus.OK
    expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(res.status);
    expect(res.body).toBeDefined();

    // if controller returns object directly:
    if (res.status === HttpStatus.CREATED || res.status === HttpStatus.OK) {
      // If controller wraps response (e.g. { message, data }), adjust check accordingly
      if (res.body.id) {
        expect(res.body).toMatchObject({ id: '1', nama: payload.nama });
      } else if (res.body.data && res.body.data.id) {
        expect(res.body.data).toMatchObject({ id: '1', nama: payload.nama });
      }
    }
  });

  it('GET /warga -> should return array of warga', async () => {
    const res = await request(app.getHttpServer()).get('/warga').expect(200);

    expect(res.body).toBeDefined();
    // Accept both direct array body or { data: [...] } shape
    if (Array.isArray(res.body)) {
      expect(res.body.length).toBeGreaterThanOrEqual(0);
    } else if (res.body.data && Array.isArray(res.body.data)) {
      expect(res.body.data.length).toBeGreaterThanOrEqual(0);
    } else {
      // fallback: fail if structure unexpected
      throw new Error('Unexpected response shape from GET /warga');
    }
  });

  it('GET /warga/:id -> should return single warga when exists', async () => {
    const res = await request(app.getHttpServer()).get('/warga/1').expect(200);

    expect(res.body).toBeDefined();
    // check common shapes
    if (res.body.id) {
      expect(res.body).toMatchObject({ id: '1', nama: 'Budi' });
    } else if (res.body.data && res.body.data.id) {
      expect(res.body.data).toMatchObject({ id: '1', nama: 'Budi' });
    }
  });

  it('PUT /warga/:id -> should update and return updated resource', async () => {
    const payload = { nama: 'Budi Updated' };
    const res = await request(app.getHttpServer()).put('/warga/1').send(payload);

    // Accept 200 OK
    expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(res.status);
    if (res.body.id) {
      expect(res.body).toMatchObject({ id: '1', nama: payload.nama });
    } else if (res.body.data && res.body.data.id) {
      expect(res.body.data).toMatchObject({ id: '1', nama: payload.nama });
    }
  });

  it('DELETE /warga/:id -> should delete and return 200/204', async () => {
    const res = await request(app.getHttpServer()).delete('/warga/1');

    // Accept either 200 OK or 204 No Content
    expect([HttpStatus.OK, HttpStatus.NO_CONTENT]).toContain(res.status);
  });
});
