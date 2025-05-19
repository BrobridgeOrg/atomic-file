module.exports = function applySchema(input, schema) {
  const output = {};

  for (const key in schema) {
    const { type, default: defVal } = schema[key];
    let value = input[key];

    // Check if the value is undefined and if a default value is provided
    if (value === undefined) {
      value = typeof defVal === 'function' ? defVal() : defVal;
    }

    // Check if the value is not undefined and convert it to the specified type
    if (value !== undefined) {
      switch (type) {
        case 'string': value = String(value); break;
        case 'number': value = Number(value); break;
        case 'boolean': value = value === 'false' ? false : Boolean(value); break;
        case 'array': value = Array.isArray(value) ? value : [value]; break;
        case 'object': value = typeof value === 'object' ? value : {}; break;
      }
    }

    output[key] = value;
  }

  return output;
}
