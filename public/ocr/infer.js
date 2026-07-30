
async function runInference(
  session,
  inputTensor
){
  const inputName = session.inputNames[0];
  const outputMap = await session.run({ [inputName]: inputTensor });
  return outputMap[session.outputNames[0]];
}

module.exports = {
  runInference
}
