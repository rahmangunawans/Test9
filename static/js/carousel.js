// Hero Carousel Implementation
class HeroCarousel {
    constructor(carouselElement) {
        this.carousel = carouselElement;
        this.currentSlide = 0;
        this.slides = this.carousel.querySelectorAll('.hero-carousel-slide');
        this.indicators = this.carousel.querySelectorAll('.hero-carousel-indicator');
        this.prevBtn = this.carousel.querySelector('.hero-carousel-prev');
        this.nextBtn = this.carousel.querySelector('.hero-carousel-next');
        this.totalSlides = this.slides.length;
        this.autoSlideInterval = null;
        this.isTransitioning = false;
        
        console.log('Hero Carousel initialized with', this.totalSlides, 'slides');
        this.init();
    }
    
    init() {
        if (this.totalSlides <= 1) return;
        
        // Start auto-slide
        this.startAutoSlide();
        
        // Add event listeners for navigation
        this.addEventListeners();
        
        // Initialize first slide
        this.updateSlideDisplay();
    }
    
    addEventListeners() {
        // Previous button
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Previous button clicked');
                this.previousSlide();
            });
        }
        
        // Next button
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Next button clicked');
                this.nextSlide();
            });
        }
        
        // Indicator buttons
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Indicator clicked:', index);
                this.goToSlide(index);
            });
        });
        
        // Pause auto-slide on hover
        if (this.carousel) {
            this.carousel.addEventListener('mouseenter', () => this.pauseAutoSlide());
            this.carousel.addEventListener('mouseleave', () => this.startAutoSlide());
        }
        
        // Touch/swipe support for mobile
        let startX = 0;
        let endX = 0;
        
        if (this.carousel) {
            this.carousel.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            }, { passive: true });
            
            this.carousel.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                this.handleSwipe(startX, endX);
            }, { passive: true });
        }
    }
    
    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        }
    }
    
    nextSlide() {
        if (this.totalSlides <= 1 || this.isTransitioning) return;
        
        console.log('Next slide from', this.currentSlide);
        this.isTransitioning = true;
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateSlideDisplay();
        this.resetAutoSlide();
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 700);
    }
    
    previousSlide() {
        if (this.totalSlides <= 1 || this.isTransitioning) return;
        
        console.log('Previous slide from', this.currentSlide);
        this.isTransitioning = true;
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateSlideDisplay();
        this.resetAutoSlide();
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 700);
    }
    
    goToSlide(index) {
        if (index === this.currentSlide || this.totalSlides <= 1 || this.isTransitioning) return;
        
        console.log('Go to slide', index);
        this.isTransitioning = true;
        this.currentSlide = index;
        this.updateSlideDisplay();
        this.resetAutoSlide();
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 700);
    }
    
    updateSlideDisplay() {
        console.log('Updating slide display, current:', this.currentSlide);
        
        // Update slides
        this.slides.forEach((slide, index) => {
            slide.classList.remove('active');
            
            if (index === this.currentSlide) {
                slide.style.transform = 'translateX(0%)';
                slide.style.opacity = '1';
                slide.style.visibility = 'visible';
                slide.classList.add('active');
            } else if (index < this.currentSlide) {
                slide.style.transform = 'translateX(-100%)';
                slide.style.opacity = '0';
                slide.style.visibility = 'hidden';
            } else {
                slide.style.transform = 'translateX(100%)';
                slide.style.opacity = '0';
                slide.style.visibility = 'hidden';
            }
        });
        
        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.remove('bg-white');
            indicator.classList.add('bg-white/30');
            
            if (index === this.currentSlide) {
                indicator.classList.remove('bg-white/30');
                indicator.classList.add('bg-white');
            }
        });
    }
    
    startAutoSlide() {
        if (this.totalSlides <= 1) return;
        
        this.pauseAutoSlide();
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, 8000);
    }
    
    pauseAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }
    
    resetAutoSlide() {
        this.startAutoSlide();
    }
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, looking for hero carousel...');
    const heroCarousel = document.querySelector('.hero-carousel');
    if (heroCarousel) {
        console.log('Hero carousel found, initializing...');
        window.heroCarouselInstance = new HeroCarousel(heroCarousel);
    } else {
        console.log('No hero carousel found');
    }
});

// Fallback initialization
window.addEventListener('load', () => {
    if (!window.heroCarouselInstance) {
        const heroCarousel = document.querySelector('.hero-carousel');
        if (heroCarousel) {
            console.log('Hero carousel found on window load, initializing...');
            window.heroCarouselInstance = new HeroCarousel(heroCarousel);
        }
    }
});