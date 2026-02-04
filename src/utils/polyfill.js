if (typeof window === 'undefined') {
  if (typeof global.localStorage === 'undefined' || typeof global.localStorage.getItem !== 'function') {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
  }
}
