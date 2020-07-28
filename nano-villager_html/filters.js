/* global document */
/* global history */
/* global pico8Filter */
/* global URL */
/* global URLSearchParams */
/* global window */

import defaultFilter from './filters/default.js';
import oldTelevisionFrame from './filters/old-television-frame.js';
import oldTV from './filters/old-tv.js';
import oldTVEffect from './filters/old-tv-effect.js';
import glitch2 from './filters/glitch2.js';
import vcrDistortion from './filters/vcr-distortion.js';
import distortedTV from './filters/distorted-tv.js';
import mattiasCRT from './filters/mattias-crt.js';
import hq4x from './filters/hq4x/hq4x.js';
import loResRoto from './filters/lo-res-roto.js';
import hiResRoto from './filters/hi-res-roto.js';

const filters = [
  defaultFilter,
  oldTelevisionFrame,
  oldTV,
  oldTVEffect,
  glitch2,
  vcrDistortion,
  distortedTV,
  mattiasCRT,
  hq4x,
  loResRoto,
  hiResRoto,
];



// because the script is before the body 😅
window.onload = function() {
  const srcElem = document.querySelector('#src');
  const authorElem = document.querySelector('#author');
  const licenseElem = document.querySelector('#license');

  function setFilter(ndx) {
    const filterInfo = filters[ndx];
    const {author, authorUrl, src, license, licenseUrl, filter} = filterInfo;
    srcElem.href = src || '';
    authorElem.textContent = author;
    authorElem.href = authorUrl;
    licenseElem.textContent = license;
    licenseElem.href = licenseUrl || '';
    pico8Filter.setFilter(filter);
  }

  let firstFilterNdx = 7;
  const settings = Object.fromEntries(new URLSearchParams(window.location.search).entries());
  if (settings.filter) {
    const index = filters.map(f => f.name).indexOf(settings.filter);
    if (index >= 0) {
      firstFilterNdx = index;
    }
  }


  const selectElem = document.querySelector('.filters select');
  filters.forEach((filter) => {
    const optionElem = document.createElement('option');
    optionElem.innerText = filter.name;
    selectElem.appendChild(optionElem);
  });
  selectElem.selectedIndex = firstFilterNdx;
  setFilter(firstFilterNdx);
  selectElem.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('filter', filters[selectElem.selectedIndex].name);
    history.replaceState(null, '', url.href);
    setFilter(selectElem.selectedIndex);
  });
};

