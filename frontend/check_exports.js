import * as p from 'react-resizable-panels';
console.log('Keys:', Object.keys(p));
try {
  console.log('Default keys:', Object.keys(p.default));
} catch (e) {
  console.log('No default export or keys');
}
