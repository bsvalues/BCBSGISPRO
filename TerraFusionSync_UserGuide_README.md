# TerraFusionSync User Guide

This package contains the enhanced TerraFusionSync User Guide with screenshots and visual aids to help users navigate the system.

## Contents

- `TerraFusionSync_UserGuide_Enhanced.html` - The comprehensive user guide in HTML format with embedded screenshots
- `screenshots/` directory - Contains HTML mockups used to generate the screenshots
- `generate_pdf.js` - A script that would generate a PDF version of the guide (simulated for demonstration)

## Converting to PDF

In a real-world environment, you would use one of these methods to convert the HTML guide to PDF:

### Option 1: Using Chrome or Edge Browser

1. Open `TerraFusionSync_UserGuide_Enhanced.html` in Chrome or Edge
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Change the destination to "Save as PDF"
4. Click "Save"

### Option 2: Using wkhtmltopdf

If you have [wkhtmltopdf](https://wkhtmltopdf.org/) installed:

```bash
wkhtmltopdf TerraFusionSync_UserGuide_Enhanced.html TerraFusionSync_UserGuide.pdf
```

### Option 3: Using a Node.js Script with Puppeteer

For automated PDF generation, you would use a script like this with [Puppeteer](https://pptr.dev/):

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${__dirname}/TerraFusionSync_UserGuide_Enhanced.html`, {
    waitUntil: 'networkidle2',
  });
  await page.pdf({
    path: 'TerraFusionSync_UserGuide.pdf',
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
    }
  });
  await browser.close();
})();
```

## Customizing the Guide

To customize the guide:

1. Edit `TerraFusionSync_UserGuide_Enhanced.html` in any text editor
2. Modify the text, styling, or images as needed
3. Regenerate the PDF if required

## Distribution

This guide is designed to be distributed to County staff members who need to use the TerraFusionSync system. It can be:

- Printed and bound for physical distribution
- Saved as a PDF and distributed electronically
- Hosted on an internal website for easy access

For questions or to request updates to this guide, contact the Benton County IT Department.