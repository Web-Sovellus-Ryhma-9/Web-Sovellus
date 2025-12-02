import { getReviews } from '../review_controller.js';
import * as reviewModel from '../../models/review_model.js';

jest.mock('../../models/review_model.js');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('review_controller.getReviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns list of reviews for movie', async () => {
    const rows = [
      { review_id: 1, movie_id: '123', account_id: 2, username: 'bob', rating: 5, comment: 'Great', created_at: '2020-01-01T00:00:00Z' }
    ];
    reviewModel.getReviewsByMovie.mockResolvedValue(rows);

    const req = { params: { id: '123' } };
    const res = makeRes();
    const next = jest.fn();

    await getReviews(req, res, next);

    expect(reviewModel.getReviewsByMovie).toHaveBeenCalledWith('123');
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 1, movie_id: '123', account_id: 2, username: 'bob', rating: 5, comment: 'Great', created_at: '2020-01-01T00:00:00Z' })
    ]));
  });

  test('missing movie id returns 400', async () => {
    const req = { params: {} };
    const res = makeRes();
    const next = jest.fn();

    await getReviews(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing movie id' });
  });

  test('calls next on model error', async () => {
    const req = { params: { id: '999' } };
    const res = makeRes();
    const next = jest.fn();
    const err = new Error('dbfail');
    reviewModel.getReviewsByMovie.mockRejectedValue(err);

    await getReviews(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
