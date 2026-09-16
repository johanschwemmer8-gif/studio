import {
  QrTemplateDefaultsSchema,
  QrTemplateSchema,
  SaveQrTemplateInputSchema,
} from '@/lib/schemas/qr-templates';

describe('QR Presentation Template canonical contract', () => {
  it('provides safe canonical defaults', () => {
    const parsed = QrTemplateDefaultsSchema.parse({});

    expect(parsed.colorHex).toBe('#000000');
    expect(parsed.bgColorHex).toBe('#FFFFFF');
    expect(parsed.errorCorrection).toBe('M');
    expect(parsed.moduleStyle).toBe('square');
    expect(parsed.eyeStyle).toBe('square');
    expect(parsed.logoSizeRatio).toBe(0.2);
    expect(parsed.quietZone).toBe(4);

    expect(parsed.gradient).toEqual({
      enabled: false,
      from: '#000000',
      to: '#000000',
      angle: 0,
    });

    expect(parsed.eyeColors).toEqual({
      outer: '#000000',
      inner: '#000000',
    });

    expect(parsed.backgroundLogo).toEqual({
      enabled: false,
      opacity: 0.2,
    });
  });

  it('supports the approved rich physical presentation contract', () => {
    const parsed = QrTemplateDefaultsSchema.parse({
      colorHex: '#E31837',
      bgColorHex: '#FFFFFF',
      errorCorrection: 'H',
      moduleStyle: 'rounded',
      gradient: {
        enabled: true,
        from: '#E31837',
        to: '#C8102E',
        angle: 45,
      },
      eyeStyle: 'rounded',
      eyeColors: {
        outer: '#000000',
        inner: '#E31837',
      },
      logoPath: 'https://example.com/logo.svg',
      logoSizeRatio: 0.25,
      backgroundLogo: {
        enabled: true,
        logoPath: 'https://example.com/background-logo.svg',
        opacity: 0.2,
      },
      quietZone: 4,
    });

    expect(parsed.moduleStyle).toBe('rounded');
    expect(parsed.gradient.enabled).toBe(true);
    expect(parsed.backgroundLogo.enabled).toBe(true);
    expect(parsed.backgroundLogo.opacity).toBe(0.2);
    expect(parsed.logoSizeRatio).toBe(0.25);
  });

  it('rejects unsafe quiet zones', () => {
    expect(() =>
      QrTemplateDefaultsSchema.parse({
        quietZone: 0,
      })
    ).toThrow();
  });

  it('rejects background-logo opacity outside the safety envelope', () => {
    expect(() =>
      QrTemplateDefaultsSchema.parse({
        backgroundLogo: {
          enabled: true,
          logoPath: 'https://example.com/logo.svg',
          opacity: 0.9,
        },
      })
    ).toThrow();
  });

  it('rejects invalid colours', () => {
    expect(() =>
      QrTemplateDefaultsSchema.parse({
        colorHex: 'red',
      })
    ).toThrow();
  });

  it('does not accept AI experience configuration as QR presentation data', () => {
    const parsed = QrTemplateDefaultsSchema.parse({
      colorHex: '#000000',
      aiTone: 'friendly',
      aiGoal: 'sell more',
    });

    expect('aiTone' in parsed).toBe(false);
    expect('aiGoal' in parsed).toBe(false);
  });

  it('allows templateId only as an optional save/update selector', () => {
    const createInput = SaveQrTemplateInputSchema.parse({
      retailerId: 'retailer-a',
      name: 'Retailer Brand',
      defaults: {},
    });

    expect(createInput.templateId).toBeUndefined();

    const updateInput = SaveQrTemplateInputSchema.parse({
      retailerId: 'retailer-a',
      templateId: 'template-123',
      name: 'Retailer Brand Updated',
      defaults: {},
    });

    expect(updateInput.templateId).toBe('template-123');
  });

  it('keeps identity and ownership outside presentation defaults', () => {
    const template = QrTemplateSchema.parse({
      templateId: 'template-123',
      retailerId: 'retailer-a',
      name: 'Retailer Brand',
      defaults: {},
    });

    expect(template.templateId).toBe('template-123');
    expect(template.retailerId).toBe('retailer-a');

    expect('templateId' in template.defaults).toBe(false);
    expect('retailerId' in template.defaults).toBe(false);
    expect('trackingUrl' in template.defaults).toBe(false);
    expect('activationId' in template.defaults).toBe(false);
    expect('deploymentId' in template.defaults).toBe(false);
  });
});

describe('Objective 14.4 Deployment Pack presentation-selection contract', () => {
  it('requires templateId without accepting presentation defaults', async () => {
    const { GenerateDeploymentPackInputSchema } = await import(
      './schemas/deployment-command'
    );

    const withoutTemplate = GenerateDeploymentPackInputSchema.safeParse({
      idToken: 'test-token',
      retailerId: 'retailer-1',
      deploymentId: 'deployment-1',
    });

    expect(withoutTemplate.success).toBe(false);

    const withTemplate = GenerateDeploymentPackInputSchema.parse({
      idToken: 'test-token',
      retailerId: 'retailer-1',
      deploymentId: 'deployment-1',
      templateId: 'template-1',
      colorHex: '#FF0000',
      logoPath: 'https://example.com/logo.png',
    });

    expect(withTemplate).toEqual({
      idToken: 'test-token',
      retailerId: 'retailer-1',
      deploymentId: 'deployment-1',
      templateId: 'template-1',
    });

    expect('colorHex' in withTemplate).toBe(false);
    expect('logoPath' in withTemplate).toBe(false);
  });
});

describe('Objective 14.5D QR Reprint presentation-selection contract', () => {
  it('requires templateId without accepting presentation defaults', async () => {
    const { ReprintQrCodeInputSchema } = await import(
      './schemas/qr-command'
    );

    const withoutTemplate = ReprintQrCodeInputSchema.safeParse({
      idToken: 'test-token',
      retailerId: 'retailer-1',
      qrCodeId: 'qr-1',
    });

    expect(withoutTemplate.success).toBe(false);

    const withTemplate = ReprintQrCodeInputSchema.parse({
      idToken: 'test-token',
      retailerId: 'retailer-1',
      qrCodeId: 'qr-1',
      templateId: 'template-1',
      colorHex: '#FF0000',
      logoPath: 'https://example.com/logo.png',
      quietZone: 12,
    });

    expect(withTemplate).toEqual({
      idToken: 'test-token',
      retailerId: 'retailer-1',
      qrCodeId: 'qr-1',
      templateId: 'template-1',
    });

    expect('colorHex' in withTemplate).toBe(false);
    expect('logoPath' in withTemplate).toBe(false);
    expect('quietZone' in withTemplate).toBe(false);
  });
});
