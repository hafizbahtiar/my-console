# Invoice Generation Dependencies Research

## Overview

This document provides a comprehensive analysis of the top 5 invoice generation libraries suitable for React/Next.js applications, with a focus on quality, TypeScript support, and developer experience similar to TipTap's excellence.

---

## 🏆 Top 5 Recommendations

### 1. **@react-pdf/renderer** ⭐⭐⭐⭐⭐
**Best for: React-first applications with component-based PDF generation**

#### Overview
A declarative library for creating PDFs using React components. It's the most popular React PDF library with excellent TypeScript support and a React-native approach.

#### Key Features
- ✅ **React Component API** - Write PDFs like React components
- ✅ **Full TypeScript Support** - Excellent type definitions
- ✅ **Server-Side Rendering** - Works perfectly with Next.js API routes
- ✅ **Flexible Layouts** - Flexbox-like layout system
- ✅ **Image Support** - Embed images, logos, QR codes
- ✅ **Font Customization** - Custom fonts support
- ✅ **Active Development** - Regularly updated, large community

#### Installation
```bash
npm install @react-pdf/renderer
# or
bun add @react-pdf/renderer
```

#### Example Usage
```tsx
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const InvoiceDocument = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Invoice #{invoice.number}</Text>
      </View>
      <View style={styles.items}>
        {invoice.items.map(item => (
          <View key={item.id} style={styles.row}>
            <Text>{item.description}</Text>
            <Text>${item.amount}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text>Total: ${invoice.total}</Text>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { marginBottom: 20 },
  // ... more styles
});

// Download link
<PDFDownloadLink document={<InvoiceDocument invoice={data} />} fileName="invoice.pdf">
  {({ blob, url, loading, error }) => 
    loading ? 'Loading...' : 'Download Invoice'
  }
</PDFDownloadLink>
```

#### Pros
- ✅ React-native syntax (familiar to React developers)
- ✅ Component reusability
- ✅ Excellent TypeScript support
- ✅ Works seamlessly with Next.js
- ✅ Large community and documentation
- ✅ Can be used server-side or client-side

#### Cons
- ⚠️ Learning curve for complex layouts
- ⚠️ Limited advanced PDF features (no forms, annotations)
- ⚠️ Bundle size (~200KB)

#### Best Use Case
Perfect for your application if you want a React-first approach with component-based invoice templates that can be easily maintained and customized.

---

### 2. **pdfme** ⭐⭐⭐⭐⭐
**Best for: Template-based PDF generation with WYSIWYG editor**

#### Overview
An open-source TypeScript-first library with a WYSIWYG template editor. Built specifically for generating PDFs from templates with a React-first API.

#### Key Features
- ✅ **WYSIWYG Template Editor** - Visual template builder
- ✅ **TypeScript First** - Excellent type safety
- ✅ **Template System** - Create reusable invoice templates
- ✅ **Form Data Integration** - Generate PDFs from form data
- ✅ **React Components** - React-friendly API
- ✅ **Template Designer UI** - Built-in template editor component
- ✅ **Active Development** - Modern, well-maintained

#### Installation
```bash
npm install @pdfme/generator @pdfme/ui
# or
bun add @pdfme/generator @pdfme/ui
```

#### Example Usage
```tsx
import { generate } from '@pdfme/generator';
import { Template, BLANK_PDF } from '@pdfme/common';

const template: Template = {
  basePdf: BLANK_PDF,
  schemas: [
    {
      invoiceNumber: {
        type: 'text',
        position: { x: 20, y: 20 },
        width: 100,
        height: 10,
      },
      items: {
        type: 'text',
        position: { x: 20, y: 50 },
        width: 500,
        height: 200,
      },
    },
  ],
};

const inputs = [
  {
    invoiceNumber: 'INV-001',
    items: 'Item 1: $100\nItem 2: $200',
  },
];

const pdf = await generate({ template, inputs });
```

#### Pros
- ✅ Visual template editor (like TipTap's visual editor)
- ✅ Template-based approach (reusable templates)
- ✅ TypeScript-first with excellent types
- ✅ Modern architecture
- ✅ React components for template designer
- ✅ Good documentation

#### Cons
- ⚠️ Smaller community than @react-pdf/renderer
- ⚠️ Template learning curve
- ⚠️ Less flexible for complex custom layouts

#### Best Use Case
Ideal if you want a template-based system where users can design invoice templates visually, similar to how TipTap provides a visual editor.

---

### 3. **jsPDF + html2canvas** ⭐⭐⭐⭐
**Best for: HTML/CSS-based invoice generation**

#### Overview
A popular library that generates PDFs from HTML/CSS. Works great with React when you want to style invoices using familiar CSS.

#### Key Features
- ✅ **HTML/CSS Based** - Use familiar HTML/CSS for styling
- ✅ **Wide Browser Support** - Works everywhere
- ✅ **Plugin Ecosystem** - Many plugins available
- ✅ **AutoTable Plugin** - Great for invoice line items
- ✅ **Image Support** - Embed images easily
- ✅ **Large Community** - Very popular, lots of examples

#### Installation
```bash
npm install jspdf jspdf-autotable html2canvas
# or
bun add jspdf jspdf-autotable html2canvas
```

#### Example Usage
```tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const generateInvoice = (invoiceData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Invoice', 20, 20);
  doc.text(`#${invoiceData.number}`, 150, 20);
  
  // Customer info
  doc.setFontSize(12);
  doc.text(`Bill To: ${invoiceData.customer.name}`, 20, 40);
  
  // Items table
  autoTable(doc, {
    head: [['Description', 'Quantity', 'Price', 'Total']],
    body: invoiceData.items.map(item => [
      item.description,
      item.quantity,
      `$${item.price}`,
      `$${item.total}`
    ]),
    startY: 60,
  });
  
  // Total
  doc.text(`Total: $${invoiceData.total}`, 150, doc.lastAutoTable.finalY + 10);
  
  doc.save(`invoice-${invoiceData.number}.pdf`);
};
```

#### Pros
- ✅ Familiar HTML/CSS styling
- ✅ Easy to learn
- ✅ Great for table-based invoices (with autoTable)
- ✅ Large community and examples
- ✅ Works client-side and server-side

#### Cons
- ⚠️ Less React-native (imperative API)
- ⚠️ TypeScript support is good but not perfect
- ⚠️ Can be slower for complex documents
- ⚠️ Requires html2canvas for HTML rendering (adds bundle size)

#### Best Use Case
Best if you want to style invoices using CSS and need table support for line items. Good for developers comfortable with HTML/CSS.

---

### 4. **easyinvoice** ⭐⭐⭐⭐
**Best for: Simple, quick invoice generation with minimal setup**

#### Overview
A specialized library designed specifically for generating invoices. Simple API, minimal configuration, perfect for straightforward invoice needs.

#### Key Features
- ✅ **Invoice-Specific** - Built specifically for invoices
- ✅ **Simple API** - Minimal code required
- ✅ **Professional Templates** - Pre-built invoice templates
- ✅ **Async Support** - High-volume invoice generation
- ✅ **Customizable** - Logo, colors, fields
- ✅ **Lightweight** - Small bundle size

#### Installation
```bash
npm install easyinvoice
# or
bun add easyinvoice
```

#### Example Usage
```tsx
import easyinvoice from 'easyinvoice';

const invoiceData = {
  documentTitle: 'Invoice',
  currency: 'USD',
  taxNotation: 'vat',
  marginTop: 25,
  marginRight: 25,
  marginLeft: 25,
  marginBottom: 25,
  logo: 'https://your-logo-url.com/logo.png',
  sender: {
    company: 'Your Company',
    address: '123 Street',
    zip: '12345',
    city: 'City',
    country: 'Country',
  },
  client: {
    company: 'Client Company',
    address: '456 Avenue',
    zip: '67890',
    city: 'City',
    country: 'Country',
  },
  invoiceNumber: 'INV-001',
  invoiceDate: '2025-01-15',
  products: [
    {
      quantity: 2,
      description: 'Product 1',
      tax: 0,
      price: 100,
    },
  ],
  bottomNotice: 'Thank you for your business!',
};

const { pdf } = await easyinvoice.createInvoice(invoiceData);

// Download or send
easyinvoice.download('invoice.pdf', pdf);
```

#### Pros
- ✅ Purpose-built for invoices
- ✅ Very simple API
- ✅ Professional default templates
- ✅ Small bundle size
- ✅ Fast generation

#### Cons
- ⚠️ Less flexible for custom layouts
- ⚠️ Limited customization compared to others
- ⚠️ No React components
- ⚠️ Smaller community

#### Best Use Case
Perfect if you need quick invoice generation with professional templates and don't need extensive customization. Great for MVP or simple invoice requirements.

---

### 5. **pdfmake** ⭐⭐⭐⭐
**Best for: Server-side PDF generation with rich features**

#### Overview
A powerful PDF generation library with a declarative API. Great for server-side generation in Next.js API routes.

#### Key Features
- ✅ **Rich Features** - Tables, images, vectors, fonts
- ✅ **Declarative API** - Document definition as object
- ✅ **Server-Side Optimized** - Perfect for Next.js API routes
- ✅ **Custom Fonts** - Full font support
- ✅ **Vector Graphics** - Draw shapes, lines, etc.
- ✅ **Well Documented** - Comprehensive documentation

#### Installation
```bash
npm install pdfmake
# or
bun add pdfmake
```

#### Example Usage
```tsx
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

const fonts = {
  Roboto: {
    normal: 'fonts/Roboto-Regular.ttf',
    bold: 'fonts/Roboto-Bold.ttf',
    italics: 'fonts/Roboto-Italic.ttf',
    bolditalics: 'fonts/Roboto-BoldItalic.ttf',
  },
};

const printer = new PdfPrinter(fonts);

const docDefinition: TDocumentDefinitions = {
  content: [
    { text: 'Invoice', style: 'header' },
    { text: `Invoice #${invoice.number}`, style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: [
          ['Description', 'Quantity', 'Price', 'Total'],
          ...invoice.items.map(item => [
            item.description,
            item.quantity,
            `$${item.price}`,
            `$${item.total}`,
          ]),
        ],
      },
    },
    { text: `Total: $${invoice.total}`, style: 'total' },
  ],
  styles: {
    header: { fontSize: 18, bold: true },
    subheader: { fontSize: 14, bold: true },
    total: { fontSize: 16, bold: true, alignment: 'right' },
  },
};

const pdfDoc = printer.createPdfKitDocument(docDefinition);
// Stream or save PDF
```

#### Pros
- ✅ Very powerful and feature-rich
- ✅ Great for complex invoices
- ✅ Server-side optimized
- ✅ Good TypeScript support
- ✅ Vector graphics support
- ✅ Well-documented

#### Cons
- ⚠️ More complex API
- ⚠️ Requires font files setup
- ⚠️ Less React-native
- ⚠️ Steeper learning curve

#### Best Use Case
Best for server-side invoice generation in Next.js API routes when you need advanced features like vector graphics, custom fonts, and complex layouts.

---

## 📊 Comparison Matrix

| Feature | @react-pdf/renderer | pdfme | jsPDF | easyinvoice | pdfmake |
|---------|---------------------|-------|-------|-------------|---------|
| **React Native** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐ |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Ease of Use** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Flexibility** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Template System** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Server-Side** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Community** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Bundle Size** | Medium | Small | Medium | Small | Large |
| **Learning Curve** | Medium | Medium | Easy | Very Easy | Hard |

---

## 🎯 Recommendation for My Console

### Primary Recommendation: **@react-pdf/renderer**

**Why it's the best fit:**
1. ✅ **React-first approach** - Matches your React/Next.js stack perfectly
2. ✅ **Component-based** - Similar philosophy to TipTap (component-based)
3. ✅ **TypeScript excellence** - Full type safety like TipTap
4. ✅ **Next.js compatible** - Works perfectly with API routes
5. ✅ **Large community** - Well-maintained, lots of examples
6. ✅ **Flexible** - Can create any invoice layout you need

### Secondary Recommendation: **pdfme**

**Why it's a great alternative:**
1. ✅ **Template-based** - Visual template editor (like TipTap's visual editor)
2. ✅ **TypeScript-first** - Excellent type safety
3. ✅ **WYSIWYG editor** - Users can design templates visually
4. ✅ **Modern architecture** - Built for modern React apps

---

## 🚀 Implementation Strategy

### Phase 1: Basic Invoice Generation
- Use `@react-pdf/renderer` for initial implementation
- Create basic invoice template component
- Implement PDF download functionality

### Phase 2: Advanced Features
- Add invoice templates (multiple designs)
- Implement invoice numbering system
- Add email sending capability

### Phase 3: Template Customization
- Consider adding `pdfme` for user-customizable templates
- Allow users to design their own invoice templates

---

## 📦 Additional Dependencies Needed

### For Email Sending
- `nodemailer` or `resend` - Send invoices via email
- `@react-email/components` - Email templates (optional)

### For Invoice Numbering
- Custom logic or `invoice-number-generator` package

### For Payment Tracking
- Integration with payment gateways (Stripe, PayPal, etc.)

### For Storage
- Appwrite Storage - Store generated PDFs
- Or generate on-demand (recommended)

---

## 🔗 Resources

- [@react-pdf/renderer Documentation](https://react-pdf.org/)
- [pdfme Documentation](https://pdfme.com/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [easyinvoice Documentation](https://www.npmjs.com/package/easyinvoice)
- [pdfmake Documentation](http://pdfmake.org/)

---

## 📝 Next Steps

1. **Install @react-pdf/renderer**
   ```bash
   bun add @react-pdf/renderer
   ```

2. **Create invoice template component**
   - Design invoice layout
   - Create reusable components (Header, LineItems, Footer)

3. **Implement API route**
   - Create `/api/invoices/[id]/pdf` endpoint
   - Generate PDF server-side

4. **Add download functionality**
   - Client-side download button
   - Email sending option

5. **Test and iterate**
   - Test with various invoice data
   - Refine template design

---

*Last Updated: November 7, 2025*

