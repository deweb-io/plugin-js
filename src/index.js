/**
 * @typedef {object} Plugin ToolData
 * @description Plugin Tool's input and output data format
 * @property {string} link — data url
 * @property {metaData} meta — fetched link data
 */

/**
 * @typedef {object} metaData
 * @description Fetched link meta data
 * @property {string} image - link's meta image
 * @property {string} title - link's meta title
 * @property {string} description - link's description
 */

// eslint-disable-next-line
import css from './index.css';
import ToolboxIcon from './svg/toolbox.svg';
import ajax from '@codexteam/ajax';
// eslint-disable-next-line
import polyfill from 'url-polyfill';

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on link data fetching
 * @property {number} success  - 1 for successful uploading, 0 for failure
 * @property {metaData} meta - Object with link data.
 *
 * Tool may have any data provided by backend, currently are supported by design:
 * title, description, image, url
 */
export default class PluginTool {
  /**
   * Notify core that read-only mode supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }


  /**
 * Paste configuration to enable pasted URLs processing by Editor
 */
  static get pasteConfig() {
    return {
      patterns: {
        link: /http(?:s?):\/\/(?:www\.)?subbscribe.com\/product\/.*/
      }
    };
  }  

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    // return {
    //   icon: ToolboxIcon,
    //   title: 'Plugin',
    // };
  }

  /**
   * Allow to press Enter inside the LinkTool input
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * @param {LinkToolData} data - previously saved data
   * @param {config} config - user config for Tool
   * @param {object} api - Editor.js API
   * @param {boolean} readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    /**
     * Tool's initial config
     */
    this.config = {
      endpoint: config.endpoint || '',
      pluginEndpoints: config.pluginEndpoints || {},
      endpointsPasteRegex: config.endpointsPasteRegex || {},
    };

    this.nodes = {
      wrapper: null,
      container: null,
      preloader: null,
      linkContent: null,
      linkImage: null,
      linkTitle: null,
      linkDescription: null,
      linkText: null,
      cancelButton: null,
    };

    this._data = {
      link: '',
      meta: {},
    };

    this.data = data;
  }



  /**
   * Renders Block content
   *
   * @public
   *
   * @returns {HTMLDivElement}
   */
  render() {
    this.nodes.wrapper = this.make('div', this.CSS.baseClass);
    this.nodes.container = this.make('div', this.CSS.container);

    this.nodes.linkContent = this.prepareLinkPreview();
    this.nodes.preloader = this.makePreloader();

    /**
     * If Tool already has data, render link preview, otherwise insert input
     */
    if (Object.keys(this.data.meta).length) {
      this.nodes.container.appendChild(this.nodes.linkContent);
      this.showLinkPreview(this.data.meta);
    }
    else {
      this.showLinkWithoutPreview();
    }

    this.nodes.container.appendChild(this.nodes.preloader);
    this.nodes.wrapper.appendChild(this.nodes.container);

    return this.nodes.wrapper;
  }

  rendered() {

  }

  /**
   * Return Block data
   *
   * @public
   *
   * @returns {LinkToolData}
   */
  save() {
    return this.data;
  }

  /**
   * Validate Block data
   * - check if given link is an empty string or not.
   *
   * @public
   *
   * @returns {boolean} false if saved data is incorrect, otherwise true
   */
  validate() {
    console.log('plagin validate (need blocked endpoints)', this.config.pluginEndpoints, link);
    //this.nodes.wrapper.remove();
    return this.data.link.trim() !== '';
  }

  /**
   * Stores all Tool's data
   *
   * @param {LinkToolData} data
   */
  set data(data) {
    this._data = Object.assign({}, {
      link: data.link || this._data.link,
      meta: data.meta || this._data.meta,
    });
  }

  /**
   * Return Tool data
   *
   * @returns {LinkToolData}
   */
  get data() {
    return this._data;
  }

  /**
   * @returns {object} - Link Tool styles
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,

      /**
       * Tool's classes
       */
      container: 'link-tool',
      linkContent: 'link-tool__content',
      linkContentRendered: 'link-tool__content--rendered',
      linkImage: 'link-tool__image',
      linkTitle: 'link-tool__title',
      linkDescription: 'link-tool__description',
      linkText: 'link-tool__anchor',
      cancelButton: 'link-tool__cancel-button',
      preloader: 'link-tool__preloader',
      preloaderUrl: 'link-tool__preloader-url',
      preloaderActive: 'link-tool__preloader--active'
    };
  }

  /**
     * Handle pasted url and return Service object
     *
     * @param {PasteEvent} event- event with pasted data
     * @returns {Service}
     */
  onPaste(event) {
    const { data: url } = event.detail;

    // Start fectching
    this.removeErrorStyle();
    this.fetchLinkData(url);

    this.showLoading(url);
  }

  cancelLinkPreview() {
    this.data.meta = {};
    this.nodes.container.innerHTML = '';

    this.showLinkWithoutPreview();
  }

  makeCancelButton() {
    const el = this.make('div', this.CSS.cancelButton);

    el.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      this.cancelLinkPreview();
    });

    return el;
  }
  /**
   * Prepare input holder
   *
   * @returns {HTMLElement}
   */
  makePreloader() {
    const preloader = document.createElement('preloader');
    const url = document.createElement('div');

    url.textContent = this.data.link;

    preloader.classList.add(this.CSS.preloader);
    url.classList.add(this.CSS.preloaderUrl);

    preloader.appendChild(url);

    return preloader;

    // const el = this.make('div', this.CSS.Preloader);

    // if (!this.readOnly) {
    //   this.nodes.input.addEventListener('paste', (event) => {
    //     this.startFetching(event);
    //   });

    //   this.nodes.input.addEventListener('keydown', (event) => {
    //     const [ENTER, A] = [13, 65];
    //     const cmdPressed = event.ctrlKey || event.metaKey;

    //     switch (event.keyCode) {
    //       case ENTER:
    //         event.preventDefault();
    //         event.stopPropagation();

    //         this.startFetching(event);
    //         break;
    //       case A:
    //         if (cmdPressed) {
    //           this.selectLinkUrl(event);
    //         }
    //         break;
    //     }
    //   });
    // }

    // inputHolder.appendChild(this.nodes.Preloader);
    // inputHolder.appendChild(this.nodes.input);

    // return inputHolder;
  }

  // /**
  //  * Activates link data fetching by url
  //  *
  //  * @param {PasteEvent} event
  //  */
  // startFetching(event) {
  //   let url = this.nodes.input.textContent;

  //   if (event.type === 'paste') {
  //     url = (event.clipboardData || window.clipboardData).getData('text');
  //   }

  //   this.removeErrorStyle();
  //   this.fetchLinkData(url);
  // }

  /**
   * If previous link data fetching failed, remove error styles
   */
  removeErrorStyle() {
    // this.nodes.inputHolder.classList.remove(this.CSS.inputError);
    // this.nodes.inputHolder.insertBefore(this.nodes.Preloader, this.nodes.input);
  }

  /**
   * Select LinkTool input content by CMD+A
   *
   * @param {KeyboardEvent} event
   */
  // selectLinkUrl(event) {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   const selection = window.getSelection();
  //   const range = new Range();

  //   const currentNode = selection.anchorNode.parentNode;
  //   const currentItem = currentNode.closest(`.${this.CSS.inputHolder}`);
  //   const inputElement = currentItem.querySelector(`.${this.CSS.inputEl}`);

  //   range.selectNodeContents(inputElement);

  //   selection.removeAllRanges();
  //   selection.addRange(range);
  // }

  /**
   * Prepare link preview holder
   *
   * @returns {HTMLElement}
   */
  prepareLinkPreview() {
    const holder = this.make('a', this.CSS.linkContent, {
      target: '_blank',
      rel: 'nofollow noindex noreferrer',
    });

    this.nodes.linkImage = this.make('div', this.CSS.linkImage);
    this.nodes.linkTitle = this.make('div', this.CSS.linkTitle);
    this.nodes.linkDescription = this.make('p', this.CSS.linkDescription);
    this.nodes.linkText = this.make('span', this.CSS.linkText);

    if (!this.readOnly)
      this.nodes.cancelButton = this.makeCancelButton();

    return holder;
  }

  showLinkWithoutPreview() {
    const el = this.make('a', '', {
      target: '_blank',
      rel: 'nofollow noindex noreferrer'
    });

    el.setAttribute('href', this.data.link);
    el.innerText = this.data.link;

    this.nodes.container.appendChild(el);
    // this.nodes.wrapper.contentEditable = true;
  }

  /**
   * Compose link preview from fetched data
   *
   * @param {metaData} meta - link meta data
   */
  showLinkPreview({ image, title, description }) {
    this.nodes.container.appendChild(this.nodes.linkContent);
    console.log(image && image.url);
    if (image && image.url) {
      this.nodes.linkImage.style.backgroundImage = 'url(' + image.url + ')';
      this.nodes.linkContent.appendChild(this.nodes.linkImage);
    }

    if (title) {
      this.nodes.linkTitle.textContent = title;
      this.nodes.linkContent.appendChild(this.nodes.linkTitle);
    }

    if (description) {
      this.nodes.linkDescription.textContent = description;
      this.nodes.linkContent.appendChild(this.nodes.linkDescription);
    }

    this.nodes.linkContent.classList.add(this.CSS.linkContentRendered);
    this.nodes.linkContent.setAttribute('href', this.data.link);
    this.nodes.linkContent.appendChild(this.nodes.linkText);

    if (!this.readOnly)
      this.nodes.linkContent.appendChild(this.nodes.cancelButton);

    try {
      this.nodes.linkText.textContent = (new URL(this.data.link)).hostname;
    } catch (e) {
      this.nodes.linkText.textContent = this.data.link;
    }
  }

  showLoading(url) {
    this.nodes.preloader.classList.add(this.CSS.preloaderActive);
    this.nodes.preloader.querySelector('.' + this.CSS.preloaderUrl).innerText = url;
  }

  hideLoading() {
    this.nodes.preloader.classList.remove(this.CSS.preloaderActive);
  }

  /**
   * If data fetching failed, set input error style
   */
  applyErrorStyle() {
    // this.nodes.inputHolder.classList.add(this.CSS.inputError);
    // this.nodes.Preloader.remove();
  }

  /**
   * Sends to backend pasted url and receives link data
   *
   * @param {string} url - link source url
   */
  async fetchLinkData(url) {
    this.showLoading();
    this.data = { link: url };

    try {
      const { body } = await (ajax.get({
        url: this.config.endpoint,
        data: {
          url
        },
      }));

      this.hideLoading();
      this.onFetch(url, body);
    } catch (error) {
      console.error(error);
      this.hideLoading();
      this.fetchingFailed(url, this.api.i18n.t('Couldn\'t fetch the plugin data'));
    }
  }

  /**
   * Link data fetching callback
   *
   * @param {UploadResponseFormat} response
   */
  onFetch(url, response) {
    if (!response || !response.success) {
      this.fetchingFailed(url, this.api.i18n.t('Couldn\'t get this plugin data, try the other one'));

      return;
    }

    const metaData = response.meta;

    this.data = { meta: metaData };

    if (!metaData) {
      this.fetchingFailed(url, this.api.i18n.t('Wrong response format from the server'));

      return;
    }

    this.hideLoading();
    this.showLinkPreview(metaData);
  }

  /**
   * Handle link fetching errors
   *
   * @private
   *
   * @param {string} errorMessage
   */
  fetchingFailed(url, errorMessage) {
    this.api.notifier.show({
      message: errorMessage,
      style: 'error'
    });

    this.showLinkWithoutPreview(url);
    this.applyErrorStyle();
  }

  /**
   * Helper method for elements creation
   *
   * @param tagName
   * @param classNames
   * @param attributes
   * @returns {HTMLElement}
   */
  make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      el[attrName] = attributes[attrName];
    }

    return el;
  }
}
