export type PriceFetchErrorCode = 'unsupported' | 'not_found' | 'network' | 'parse';

export class PriceFetchError extends Error {
  readonly code: PriceFetchErrorCode;

  constructor(message: string, code: PriceFetchErrorCode) {
    super(message);
    this.name = 'PriceFetchError';
    this.code = code;
  }
}
