const mammoth = require('mammoth');
const fs = require('fs');

mammoth.convertToHtml({path: 'test-answer.docx'}).then(r => {
  const html = r.value;
  
  // Save full HTML for inspection
  fs.writeFileSync('debug-html.html', html);
  console.log('Saved full HTML to debug-html.html');
  
  // Find all green colored text
  const greenTexts = html.match(/color:\s*green[^>]*>[^<]*/gi);
  console.log('\n=== Green colored texts (likely answers) ===');
  greenTexts?.forEach((t, i) => console.log(i + ':', t));
  
  // Find all marked text
  const markTexts = html.match(/<mark[^>]*>([^<]*)<\/mark>/g);
  console.log('\n=== Marked/Highlighted texts ===');
  markTexts?.forEach((t, i) => console.log(i + ':', t));
  
  // Find patterns like "A. content" with any styling
  const styledChoices = html.match(/<[^>]+(style|color)[^>]*>\s*[A-D]\.\s*[^<]*/gi);
  console.log('\n=== Styled choices ===');
  styledChoices?.slice(0, 20).forEach((t, i) => console.log(i + ':', t.substring(0, 100)));
});
