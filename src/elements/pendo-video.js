import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-video> - Embedded video element for guides.
 *
 * Attributes:
 *   src - Video URL (supports YouTube, Vimeo, or direct video URLs)
 *   poster - Poster image URL (for native video)
 *   autoplay - Auto-play the video (default: false)
 */
class PendoVideo extends PendoBaseElement {
    connectedCallback() {
        this.classList.add('pendo-guide__video-container');

        const src = this.getAttribute('src');
        const poster = this.getAttribute('poster');
        const autoplay = this.hasAttribute('autoplay');

        if (!src) {
            console.warn('pendo-video: missing required "src" attribute');
            return;
        }

        // Detect video platform
        if (this.isYouTube(src)) {
            this.renderYouTube(src, autoplay);
        } else if (this.isVimeo(src)) {
            this.renderVimeo(src, autoplay);
        } else {
            this.renderNative(src, poster, autoplay);
        }
    }

    isYouTube(url) {
        return /youtube\.com|youtu\.be/.test(url);
    }

    isVimeo(url) {
        return /vimeo\.com/.test(url);
    }

    extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    extractVimeoId(url) {
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return match ? match[1] : null;
    }

    renderYouTube(src, autoplay) {
        const videoId = this.extractYouTubeId(src);
        if (!videoId) {
            console.warn('pendo-video: invalid YouTube URL');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.className = 'pendo-guide__video';
        iframe.src = `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.title = 'Embedded video';

        this.appendChild(iframe);
    }

    renderVimeo(src, autoplay) {
        const videoId = this.extractVimeoId(src);
        if (!videoId) {
            console.warn('pendo-video: invalid Vimeo URL');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.className = 'pendo-guide__video';
        iframe.src = `https://player.vimeo.com/video/${videoId}${autoplay ? '?autoplay=1' : ''}`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        iframe.title = 'Embedded video';

        this.appendChild(iframe);
    }

    renderNative(src, poster, autoplay) {
        const video = document.createElement('video');
        video.className = 'pendo-guide__video';
        video.src = src;
        video.controls = true;

        if (poster) video.poster = poster;
        if (autoplay) video.autoplay = true;

        // Accessibility
        video.setAttribute('preload', 'metadata');

        this.appendChild(video);
    }
}

customElements.define('pendo-video', PendoVideo);

export { PendoVideo };
