'use strict'
/* global hexo */

/*
*  Embed an image with responsive images in a post
*  https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
*  Image is resized on-the-fly using Statically Imgpx
*  https://statically.io/imgpx
*  Usage: {% image 'folder/filename.jpg' 'description' %}
*/

hexo.extend.tag.register('image', (args) => {
  let [fileName, alt] = args
  if (!alt) alt = ''
  let modern = fileName
  let legacy = fileName
  // /img/ is a reverse proxy of Statically CDN
  // See source/_redirects
  const link = '/img/'

  if (fileName.endsWith('.png') || fileName.endsWith('.jpg')) {
    modern = fileName.concat('?format=webp')
  } else if (fileName.endsWith('.webp')) {
    // Statically has yet to support animated webp
    // https://github.com/marsble/statically/issues/36
    // modern = fileName.concat('?auto_format=false')
    modern = fileName.replace(/\.webp$/, '.gif')
    legacy = fileName.replace(/\.webp$/, '.gif')
  }

  const modernLink = link + modern
  const legacyLink = link + legacy

  const img = `<img
            srcset="${legacyLink}&w=320 320w,
                  ${legacyLink}&w=468 468w,
                  ${legacyLink}&w=768 768w,
                  ${legacyLink} 800w"
            sizes="(max-width: 320px) 320px,
                  (max-width: 468px) 468px,
                  (max-width: 768px) 768px,
                  800px"
            src="${legacyLink}"
            alt="${alt}" loading="lazy">`

  if (fileName.endsWith('.png') || fileName.endsWith('.webp')) {
    return `<a href="${legacyLink}">
      <picture>
      <source type="image/webp"
        srcset="${modernLink}&w=320 320w,
              ${modernLink}&w=468 468w,
              ${modernLink}&w=768 768w,
              ${modernLink} 800w"
        sizes="(max-width: 320px) 320px,
              (max-width: 468px) 468px,
              (max-width: 768px) 768px,
              800px">
      ${img}
      </picture></a>`
  } else {
    return `<a href="${legacyLink}">${img}</a>`
  }
})