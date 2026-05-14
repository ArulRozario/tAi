import { describe, it, expect } from 'vitest';
import { generateDocxBuffer } from './docx-generator';

describe('docx-generator', () => {
  it('should generate a non-empty DOCX buffer for a simple project', async () => {
    const buffer = await generateDocxBuffer(
      {
        name: 'Test Project',
        description: 'A test description',
        sourceLang: 'English',
        targetLang: 'Tamil',
        styleGuideName: 'Theological',
      },
      [
        {
          pageNumber: 1,
          content:
            '<h1><span class="segment">ஆதியாகமம் 1</span></h1>' +
            '<p><span class="segment">ஆதியிலே வார்த்தை இருந்தது, வார்த்தை தேவனுடன் இருந்தது.</span></p>',
        },
        {
          pageNumber: 2,
          content:
            '<p><span class="segment"><b>Bold text</b> and <i>italic text</i></span></p>',
        },
      ],
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    // DOCX files start with the ZIP signature PK\x03\x04
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });

  it('should handle empty HTML content gracefully', async () => {
    const buffer = await generateDocxBuffer(
      {
        name: 'Empty Project',
        sourceLang: 'English',
        targetLang: 'Tamil',
      },
      [
        { pageNumber: 1, content: '' },
        { pageNumber: 2, content: '<p></p>' },
      ],
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('should handle headings h1-h6', async () => {
    const buffer = await generateDocxBuffer(
      {
        name: 'Headings Test',
        sourceLang: 'English',
        targetLang: 'Tamil',
      },
      [
        {
          pageNumber: 1,
          content:
            '<h1>Heading 1</h1>' +
            '<h2>Heading 2</h2>' +
            '<h3>Heading 3</h3>' +
            '<h4>Heading 4</h4>' +
            '<h5>Heading 5</h5>' +
            '<h6>Heading 6</h6>',
        },
      ],
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('should handle lists', async () => {
    const buffer = await generateDocxBuffer(
      {
        name: 'List Test',
        sourceLang: 'English',
        targetLang: 'Tamil',
      },
      [
        {
          pageNumber: 1,
          content:
            '<ul><li>Item 1</li><li>Item 2</li></ul>' +
            '<ol><li>Ordered 1</li><li>Ordered 2</li></ol>',
        },
      ],
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
