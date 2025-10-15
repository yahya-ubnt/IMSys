const formatPhoneNumber = (phone) => {
  if (phone.startsWith('+')) {
    return phone.substring(1);
  }
  if (phone.startsWith('07')) {
    return '254' + phone.substring(1);
  }
    if (phone.startsWith('7')) {
    return '254' + phone;
  }
  return phone;
};

module.exports = {
  formatPhoneNumber,
};
