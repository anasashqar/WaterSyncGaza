const fs = require('fs');
const path = require('path');

const filesToConvert = [
  { old: 'governorates.js', varName: 'const governoratesData =' },
  { old: 'localities.js', varName: 'const localitiesData =' },
  { old: 'neighborhoods.js', varName: 'const neighborhoodsData =' },
  { old: 'streets.js', varName: 'const streetsData =' }
];

filesToConvert.forEach(fileInfo => {
  const oldPath = path.join(__dirname, '../WaterSync_Latest/public/data/', fileInfo.old);
  const newPath = path.join(__dirname, 'public/data/', fileInfo.old.replace('.js', '.json'));
  
  if (fs.existsSync(oldPath)) {
    console.log(`Processing ${fileInfo.old}...`);
    let content = fs.readFileSync(oldPath, 'utf8');
    
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Replace variable declaration
    content = content.replace(fileInfo.varName, '').trim();
    if (content.endsWith(';')) {
      content = content.slice(0, -1);
    }
    
    try {
      // Validate JSON formatting
      const json = JSON.parse(content);
      
      // Look at first item name
      const firstFeature = json.features && json.features[0];
      if (firstFeature) {
        console.log(`First feature name: ${firstFeature.properties.Name_AR || firstFeature.properties.Name || firstFeature.properties.NAME}`);
      }
      
      // Save properly
      fs.writeFileSync(newPath, JSON.stringify(json, null, 2), 'utf8');
      console.log(`Saved ${newPath}`);
    } catch (e) {
      console.error(`Failed parsing ${fileInfo.old}:`, e.message);
    }
  } else {
    console.log(`${oldPath} not found`);
  }
});
