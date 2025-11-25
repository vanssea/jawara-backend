
jest.setTimeout(10000);

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
