import slugify from 'slugify';

export default str => {
  return slugify(str, {
    lower: true,
    replacement: '-',
    remove: /[\x21-\x2F\x3A-\x40\x58-\x60\x78-\x7E]/g
  })
}