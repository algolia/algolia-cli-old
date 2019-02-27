module.exports = (data, cb) => {
  try {
    const record = Object.assign({}, data);
    record.objectID = data.product_id;
    record.score = Math.floor(Math.random() * 100);
    record.formattedNumber = parseInt(data.integer_formatted_as_string, 10);
    cb(null, record);
  } catch (e) {
    console.log('Transformation error:', e.message, e.stack);
    throw e;
  }
};
