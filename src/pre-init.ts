if (typeof customElements !== 'undefined' && customElements.define) {
  const originalDefine = customElements.define;
  customElements.define = function (name, constructor, options) {
    if (!customElements.get(name)) {
      originalDefine.call(customElements, name, constructor, options);
    } else {
      console.warn(`[HMR] Custom element "${name}" is already registered. Skipping define.`);
    }
  };
}
