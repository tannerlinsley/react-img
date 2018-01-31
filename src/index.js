import React from 'react'
import PropTypes from 'prop-types'
import Img from './Img'
import inImageCache from './utils/inImageCache'
import listenToIntersections from './utils/listenToIntersections'
import isWebpSupported from './utils/isWebpSupported'

const bgColor = backgroundColor =>
  typeof backgroundColor === 'boolean' ? 'lightgray' : backgroundColor

// responsive image sizes
const responsiveSizes = size => [
  size / 4,
  size / 2,
  size,
  size * 1.5,
  size * 2,
  size * 3
]

const getWidths = (width, maxWidth) => {
  const sizes = responsiveSizes(maxWidth).filter(size => size < width)
  // Add the original width to ensure the largest image possible
  // is available for small images.
  const finalSizes = [...sizes, width]
  return finalSizes
}

// construct srcSet data
const srcSet = srcWidths =>
  srcWidths.map(width => `{{finalURL}} ${width}w`).join(',\n')

const imgSizes = maxWidth => `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`

class ReactImg extends React.Component {
  constructor(props) {
    super(props)

    let isVisible = true
    let imgLoaded = true
    let IOSupported = false

    const seenBefore = inImageCache(props)

    if (
      !seenBefore &&
      typeof window !== 'undefined' &&
      window.IntersectionObserver
    ) {
      isVisible = false
      imgLoaded = false
      IOSupported = true
    }

    // Never render image while server rendering
    if (typeof window === 'undefined') {
      isVisible = false
      imgLoaded = false
    }

    this.state = {
      isVisible,
      imgLoaded,
      IOSupported
    }

    this.handleRef = this.handleRef.bind(this)
    this.onImageLoaded = this.onImageLoaded.bind(this)
  }

  onImageLoaded() {
    if (this.state.IOSupported) {
      this.setState(
        () => ({
          imgLoaded: true
        }),
        () => {
          inImageCache(this.props.image, true)
        }
      )
    }
    if (this.props.onLoad) {
      this.props.onLoad()
    }
  }

  handleRef(ref) {
    if (this.state.IOSupported && ref) {
      listenToIntersections(ref, () => {
        this.setState({ isVisible: true, imgLoaded: false })
      })
    }
  }

  render() {
    const {
      title,
      alt,
      className,
      outerWrapperClassName,
      style,
      image: { width, height, src },
      maxWidth,
      withWebp,
      blurryPlaceholder,
      backgroundColor,
      fadeIn
    } = this.props

    // TODOs
    const finalSrc =
      withWebp && isWebpSupported
        ? `${src} of our webp img`
        : `${src} of our img`
    const thumbSrc = 'src string for the blurry 20x20 thumbnail'

    if (width && height) {
      // construct srcSet
      const srcSetImgs = srcSet(getWidths(width, maxWidth))
      const sizes = imgSizes(maxWidth)

      // The outer div is necessary to reset the z-index to 0.
      return (
        <div
          className={`${outerWrapperClassName} graphcms-image-outer-wrapper`}
          style={{
            zIndex: 0,
            // Let users set component to be absolutely positioned.
            position: style.position === 'absolute' ? 'initial' : 'relative'
          }}
        >
          <div
            className={`${className} graphcms-image-wrapper`}
            style={{
              position: 'relative',
              overflow: 'hidden',
              zIndex: 1,
              ...style
            }}
            ref={this.handleRef}
          >
            {/* Preserve the aspect ratio. */}
            <div
              style={{
                width: '100%',
                paddingBottom: `${100 / (width / height)}%`
              }}
            />

            {/* Show the blurry thumbnail image. */}
            {blurryPlaceholder && (
              <Img
                alt={alt}
                title={title}
                src={thumbSrc}
                opacity={this.state.imgLoaded ? 0 : 1}
                transitionDelay="0.25s"
              />
            )}

            {/* Show a solid background color. */}
            {backgroundColor && (
              <div
                title={title}
                style={{
                  backgroundColor: bgColor(backgroundColor),
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  opacity: this.state.imgLoaded ? 0 : 1,
                  transitionDelay: '0.25s',
                  right: 0,
                  left: 0
                }}
              />
            )}

            {/* Once the image is visible, start downloading the image */}
            {this.state.isVisible && (
              <Img
                alt={alt}
                title={title}
                srcSet={srcSetImgs}
                src={finalSrc}
                sizes={sizes}
                opacity={this.state.imgLoaded || !fadeIn ? 1 : 0}
                onLoad={this.onImageLoaded}
              />
            )}
          </div>
        </div>
      )
    }

    return null
  }
}

ReactImg.defaultProps = {
  title: '',
  alt: '',
  className: '',
  outerWrapperClassName: '',
  style: {},
  maxWidth: 800,
  withWebp: true,
  blurryPlaceholder: true,
  backgroundColor: '',
  fadeIn: true,
  onLoad: null
}

ReactImg.propTypes = {
  title: PropTypes.string,
  alt: PropTypes.string,
  // Support Glamor's css prop for classname
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  outerWrapperClassName: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  style: PropTypes.object,
  image: PropTypes.shape({
    src: PropTypes.string,
    height: PropTypes.number,
    width: PropTypes.number
  }).isRequired,
  maxWidth: PropTypes.number,
  withWebp: PropTypes.bool,
  onLoad: PropTypes.func,
  blurryPlaceholder: PropTypes.bool,
  backgroundColor: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  fadeIn: PropTypes.bool
}

export default ReactImg
