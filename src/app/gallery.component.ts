import {Router, ROUTER_DIRECTIVES} from '@angular/router';
import {Component, NgZone, ViewChild, ElementRef} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/Rx';

interface IImage {
  url: string
  thumbnail: string
  date: string
  width: number
  height: number
}

@Component({
  moduleId: module.id,
  selector: 'gallery',
  templateUrl: 'gallery.component.html',
  styleUrls: ['gallery.component.css'],
  host: {
    '(document:keydown)': '_keydown($event)',
  }
})
export class GalleryAppComponent {
  @ViewChild('galleryContainer') galleryContainer: ElementRef;
  @ViewChild('asyncLoadingContainer') asyncLoadingContainer: ElementRef;

  localState = { value: '' }
  currentImg: string
  currentIdx: number = 0
  arrows: string[] = ['assets/img/icon/left.svg', 'assets/img/icon/right.svg']
  galleryBasePath: string = 'assets/img/gallery/'
  showBig: boolean = false
  leftArrowActive: boolean = true
  rightArrowActive: boolean = true
  images: any[] = [{ url: '' }]
  gallery: any[] = []
  heightCoefficient = 6
  imgIterations = 1;
  allImagesLoaded = false

  // TypeScript public modifiers
  constructor(private _ngZone: NgZone, private http: Http, private router: Router) {

  }

  ngOnInit() {
    window.onresize = function(event) {
      this._ngZone.run(() => {
        this.scaleGallery()
      })
    }.bind(this)

    window.onscroll = function(event) {
      this._ngZone.run(() => {
        this.checkForAsyncReload()
      })
    }.bind(this)
  }

  ngAfterContentInit() {
    this.fetchDataAndRender()
  }

  fetchDataAndRender() {

    this.http.get(this.galleryBasePath + 'data.json')
      .map((res: Response) => res.json())
      .subscribe(
      data => {
        this.images = data

        let tempRow = [data[0]]
        let rowIndex = 0
        let i = 0;

        for (i; i < this.imgIterations && i < data.length; i++) {
          while (data[i + 1] && this.shouldAddCandidate(tempRow, data[i + 1])) {
            i++
          }
          if (data[i + 1]) {
            tempRow.pop()
          }
          this.gallery[rowIndex++] = tempRow

          tempRow = [data[i + 1]]
        }

        this.scaleGallery()

        if (i >= data.length) {
          this.allImagesLoaded = true
        }
        else {
          this.checkForAsyncReload()
        }
      },
      err => console.error(err),
      () => undefined)
  }

  shouldAddCandidate(imgRow: IImage[], candidate: IImage): boolean {
    let oldDifference = this.calcIdealHeight() - this.calcRowHeight(imgRow)
    imgRow.push(candidate)
    let newDifference = this.calcIdealHeight() - this.calcRowHeight(imgRow)

    return Math.abs(oldDifference) > Math.abs(newDifference)
  }

  calcRowHeight(imgRow: IImage[]) {
    let xsum = this.calcOriginalRowWidth(imgRow)

    let ratio = this.getGalleryWidth() / xsum
    let rowHeight = imgRow[0].height * ratio

    return rowHeight
  }

  scaleGallery() {
    this.gallery.forEach((imgRow) => {
      let xsum = this.calcOriginalRowWidth(imgRow)

      if (imgRow != this.gallery[this.gallery.length - 1]) {
        let ratio = this.getGalleryWidth() / xsum

        imgRow.forEach((img) => {
          img.width = img.width * ratio
          img.height = img.height * ratio
        })
      }
    })
  }

  calcOriginalRowWidth(imgRow: IImage[]) {
    let xsum = 0
    imgRow.forEach((img) => {
      let individualRatio = this.calcIdealHeight() / img.height
      img.width = img.width * individualRatio
      img.height = this.calcIdealHeight()
      xsum += img.width + 1
    })

    return xsum
  }

  calcIdealHeight() {
    let idealHeight = this.getGalleryWidth() / this.heightCoefficient
    return idealHeight
  }

  isActive(index) {
    return index == this.currentIdx
  }

  _keydown(event: KeyboardEvent) {
    let prevent = [37, 39, 27]
      .find(no => no === event.keyCode);
    if (prevent) event.preventDefault();

    switch (prevent) {
      case 37:
        // left arrow
        this.navigateLeft();
        break;
      case 39:
        // right arrow
        this.navigateRight();
        break;
      case 27:
        // esc
        this.showBig = false
        break;
    }
  }

  navigateRight() {
    if (this.currentIdx < this.images.length - 1) {
      this.currentIdx++
      this.updateArrowActivation()
    }
    this.currentImg = this.images[this.currentIdx].url

  }

  navigateLeft() {
    if (this.currentIdx > 0) {
      this.currentIdx--
      this.updateArrowActivation()
    }
    this.currentImg = this.images[this.currentIdx].url
  }

  updateArrowActivation() {
    if (this.currentIdx <= 0) {
      this.leftArrowActive = false
    }
    else {
      this.leftArrowActive = true
    }

    if (this.currentIdx >= this.images.length - 1) {
      this.rightArrowActive = false
    }
    else {
      this.rightArrowActive = true
    }
  }

  openImageViewer(img) {
    this.currentIdx = this.images.indexOf(img)
    this.updateArrowActivation()
    this.showBig = true
  }

  openFullsize() {
    window.location.href = this.images[this.currentIdx].url
  }

  private getGalleryWidth() {
    if (this.galleryContainer.nativeElement.clientWidth == 0) {
      // IE11
      return this.galleryContainer.nativeElement.scrollWidth
    }
    return this.galleryContainer.nativeElement.clientWidth
  }

  private checkForAsyncReload() {
    if (!this.allImagesLoaded) {
      var loadingDiv: any = this.asyncLoadingContainer.nativeElement

      var elmTop = loadingDiv.getBoundingClientRect().top
      var elmBottom = loadingDiv.getBoundingClientRect().bottom

      var isVisible = (elmTop >= 0) && (elmBottom <= window.innerHeight)

      if (isVisible) {
        this.imgIterations += 5
        this.fetchDataAndRender()
      }
    }
  }
}
