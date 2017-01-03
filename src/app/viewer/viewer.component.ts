import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    AfterContentInit,
    trigger,
    state,
    style,
    transition,
    animate,
    ChangeDetectorRef
} from "@angular/core"
import "rxjs/Rx"
import {ImageService} from "../services/image.service"
import {imageTransition, showViewerTransition} from "./viewer.animations";

@Component({
    selector: 'viewer',
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.css'],
    host: {
        '(document:keydown)': 'onKeydown($event)',
    },
    animations: [
        imageTransition,
        showViewerTransition
    ]
})

export class ViewerComponent {
    private images: any[] = [{}]
    private currentIdx: number = 0
    private showViewer: boolean
    private arrows: string[] = ['assets/img/icon/left.svg', 'assets/img/icon/right.svg']
    private leftArrowVisible: boolean = true
    private rightArrowVisible: boolean = true
    private qualitySelectorShown: boolean = false
    private qualitySelected: string = 'auto'
    private categorySelected: string = 'preview_xxs'
    private transform: string
    private Math: Math

    constructor(private ImageService: ImageService) {
        ImageService.imagesUpdated$.subscribe(
            images => {
                this.images = images
            })
        ImageService.imageSelectedIndexUpdated$.subscribe(
            newIndex => {
                this.currentIdx = newIndex
                this.images.forEach((image) => image['active'] = false)
                this.images[this.currentIdx]['active'] = true
                this.transform = '0px'
                this.updateQuality()
            })
        ImageService.showImageViewerChanged$.subscribe(
            showViewer => {
                this.showViewer = showViewer
            })
        this.Math = Math
    }

    public get leftArrowActive(): boolean {
        return this.currentIdx > 0
    }

    public get rightArrowActive(): boolean {
        return this.currentIdx < this.images.length - 1
    }

    public pan(swipe: any) {
        let currentDeltaX = swipe.deltaX
        this.transform = currentDeltaX + 'px'
    }

    public onResize() {
        this.images.forEach((image) => {
            image['viewerImageLoaded'] = false
            image['active'] = false
        })
        this.updateImage()
    }

    public showQualitySelector() {
        this.qualitySelectorShown = !this.qualitySelectorShown
    }

    public qualityChanged(newQuality) {
        this.qualitySelected = newQuality
        this.updateImage()
    }

    public imageLoaded(image) {
        image['viewerImageLoaded'] = true
    }

    /**
     * direction (-1: left, 1: right)
     * swipe (user swiped)
     */
    private navigate(direction: number, swipe: any) {
        if ((direction === 1 && this.currentIdx < this.images.length - 1) ||
            (direction === -1 && this.currentIdx > 0)) {

            if (direction == -1) {
                this.images[this.currentIdx]['transition'] = 'leaveToRight'
                this.images[this.currentIdx - 1]['transition'] = 'enterFromLeft'
            }
            else {
                this.images[this.currentIdx]['transition'] = 'leaveToLeft'
                this.images[this.currentIdx + 1]['transition'] = 'enterFromRight'
            }
            this.currentIdx += direction

            if (swipe) {
                this.hideNavigationArrows()
            } else {
                this.showNavigationArrows()
            }
            this.updateImage()
        }
    }

    private hideNavigationArrows() {
        this.leftArrowVisible = false
        this.rightArrowVisible = false
    }

    private showNavigationArrows() {
        this.leftArrowVisible = true
        this.rightArrowVisible = true
    }

    private closeViewer() {
        this.images.forEach((image) => image['transition'] = undefined)
        this.images.forEach((image) => image['active'] = false)
        this.ImageService.showImageViewer(false)
    }

    private updateImage() {
        // wait for animation to end
        setTimeout(() => {
            this.updateQuality()
            this.images[this.currentIdx]['active'] = true
            this.images.forEach((image) => {
                if (image != this.images[this.currentIdx]) {
                    image['active'] = false
                    this.transform = '0px'
                }
            })
        }, 500)
    }

    private updateQuality() {
        let screenWidth = window.innerWidth
        let screenHeight = window.innerHeight

        switch (this.qualitySelected) {
            case 'auto': {
                this.categorySelected = 'preview_xxs'

                if (screenWidth > this.images[this.currentIdx]['preview_xxs'].width &&
                    screenHeight > this.images[this.currentIdx]['preview_xxs'].height) {
                    this.categorySelected = 'preview_xs'
                }
                if (screenWidth > this.images[this.currentIdx]['preview_xs'].width &&
                    screenHeight > this.images[this.currentIdx]['preview_xs'].height) {
                    this.categorySelected = 'preview_s'
                }
                if (screenWidth > this.images[this.currentIdx]['preview_s'].width &&
                    screenHeight > this.images[this.currentIdx]['preview_s'].height) {
                    this.categorySelected = 'preview_m'
                }
                if (screenWidth > this.images[this.currentIdx]['preview_m'].width &&
                    screenHeight > this.images[this.currentIdx]['preview_m'].height) {
                    this.categorySelected = 'preview_l'
                }
                if (screenWidth > this.images[this.currentIdx]['preview_l'].width &&
                    screenHeight > this.images[this.currentIdx]['preview_l'].height) {
                    this.categorySelected = 'preview_xl'
                }
                if (screenWidth > this.images[this.currentIdx]['preview_xl'].width &&
                    screenHeight > this.images[this.currentIdx]['preview_xl'].height) {
                    this.categorySelected = 'raw'
                }
                break
            }
            case 'low': {
                this.categorySelected = 'preview_xxs'
                break
            }
            case 'mid': {
                this.categorySelected = 'preview_m'
                break
            }
            case 'high': {
                this.categorySelected = 'raw'
                break
            }
        }
    }

    private onKeydown(event: KeyboardEvent) {
        let prevent = [37, 39, 27, 36, 35]
            .find(no => no === event.keyCode)
        if (prevent) {
            event.preventDefault()
        }

        switch (prevent) {
            case 37:
                // navigate left
                this.navigate(-1, false)
                break
            case 39:
                // navigate right
                this.navigate(1, false)
                break
            case 27:
                // esc
                this.closeViewer()
                break
            case 36:
                // pos 1
                this.images[this.currentIdx]['transition'] = 'leaveToRight'
                this.currentIdx = 0
                this.images[this.currentIdx]['transition'] = 'enterFromLeft'
                this.updateImage()
                break
            case 35:
                // end
                this.images[this.currentIdx]['transition'] = 'leaveToLeft'
                this.currentIdx = this.images.length - 1
                this.images[this.currentIdx]['transition'] = 'enterFromRight'
                this.updateImage()
                break
        }
    }
}
