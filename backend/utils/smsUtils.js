const personalizeSms = (messageBody, data) => {
  if (!data) {
    return messageBody;
  }

  let personalizedMessage = messageBody;
  for (const key in data) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    personalizedMessage = personalizedMessage.replace(regex, data[key]);
  }
  return personalizedMessage;
};

module.exports = {
  personalizeSms,
};
