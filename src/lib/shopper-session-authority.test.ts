import { deriveShopperSessionAuthority } from './shopper-session-authority';

describe('deriveShopperSessionAuthority', () => {
  const session = {
    sessionId: 'sess_canonical',
    retailerId: 'retailer_a',
    entryGtin: '06009188000332'
  };

  test('derives retailer and GTIN from the canonical session', () => {
    expect(
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_canonical',
        session
      })
    ).toEqual({
      sessionId: 'sess_canonical',
      retailerId: 'retailer_a',
      gtin: '06009188000332',
      shopperId: 'guest'
    });
  });

  test('accepts a matching retailer hint but does not use it as authority', () => {
    expect(
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_canonical',
        requestedRetailerId: 'retailer_a',
        session
      }).retailerId
    ).toBe('retailer_a');
  });

  test('rejects a forged retailer hint', () => {
    expect(() =>
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_canonical',
        requestedRetailerId: 'retailer_b',
        session
      })
    ).toThrow('SESSION_RETAILER_MISMATCH');
  });

  test('rejects a session document identity mismatch', () => {
    expect(() =>
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_forged',
        session
      })
    ).toThrow('SESSION_INTEGRITY_ERROR');
  });

  test('rejects GTIN context that conflicts with an authoritative entry GTIN', () => {
    expect(() =>
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_canonical',
        requestedGtin: '06009188000999',
        session
      })
    ).toThrow('SESSION_GTIN_MISMATCH');
  });

  test('derives shopper identity only from the canonical session', () => {
    expect(
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_canonical',
        session: { ...session, shopperId: 'shopper_canonical' }
      }).shopperId
    ).toBe('shopper_canonical');
  });

  test('falls back to guest when the canonical session has no shopper identity', () => {
    expect(
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_canonical',
        session
      }).shopperId
    ).toBe('guest');
  });

  test('allows explicit GTIN context when the session has no entry GTIN', () => {
    const noEntryGtin = {
      sessionId: 'sess_canonical',
      retailerId: 'retailer_a'
    };

    expect(
      deriveShopperSessionAuthority({
        requestedSessionId: 'sess_canonical',
        requestedGtin: '06009188000332',
        session: noEntryGtin
      }).gtin
    ).toBe('06009188000332');
  });
});
