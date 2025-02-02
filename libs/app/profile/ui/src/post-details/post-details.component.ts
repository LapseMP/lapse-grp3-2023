import { Component, ElementRef, ViewChild } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormBuilder, Validators } from '@angular/forms';
import { IProfile, IPostDetails, stringToHashtag, Hashtag } from '@mp/api/profiles/util';
import { ProfileState } from '@mp/app/profile/data-access';
import { AddPost, CreatePostDetails, CreateNewPost } from '@mp/app/profile/util';
import {
  ActionsExecuting,
  actionsExecuting
} from '@ngxs-labs/actions-executing';
import { Select, Store } from '@ngxs/store';
import { UploadTaskSnapshot, ref } from 'firebase/storage';
import { Observable, Subscription, filter, finalize, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Logout } from '@mp/app/auth/util';

@Component({
  selector: 'ms-profile-post-details-component',
  templateUrl: './post-details.component.html',
  styleUrls: ['./post-details.component.scss'],
})
export class PostDetailsComponent {
  invalidPopup = true;
  isPosting = false;
  @Select(ProfileState.profile) profile$!: Observable<IProfile | null>;

  @Select(actionsExecuting([CreatePostDetails]))
  busy$!: Observable<ActionsExecuting>;
  postDetailsForm = this.fb.group({
    content: [''],
    caption: ['', [Validators.minLength(4), Validators.maxLength(64)]],
    hashtag: ['', [Validators.minLength(4), Validators.maxLength(64)]],
    listing: [0]
  });
  showPassword = false;
  selectedFile!: File | null;
  // get content() {
  //   console.debug(this.postDetailsForm.get('content')?.value?.split(",")[1].slice(0,10));
  //   return this.postDetailsForm.get('content');
  // }
  uploadImage(event: any) {
    console.log("Image Uploaded");
    const file: File | null = event.target.files?.[0];
    if (!file) {
      return;
    }
    const blob: Blob = new Blob([file], { type: file.type });
    const formData: FormData = new FormData();
    formData.append('image', blob, file.name);

    const reader: FileReader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img: HTMLImageElement = document.getElementById('postImage') as HTMLImageElement;
      img.src = reader.result as string;
    };

    this.selectedFile = event.target.files[0];
  }


  async createNewPost() {
    console.log("Trying to create");
    if (!this.selectedFile) {
      this.showError("Missing post details");
      return;
    }

    if (!this.isFormValid()) {
      this.showError("Missing post details");
      return;
    }

    try {
      const url = await this.uploadImageAndReturnUrl(this.selectedFile);
      console.debug("CreateComponent" + url);
      const postDetails: IPostDetails = {
        content: url,
        caption: this.postDetailsForm.get('caption')?.value,
        hashtag: stringToHashtag(this.postDetailsForm.get('hashtag')?.value),
        listing: this.postDetailsForm.get('listing')?.value
      };
      this.store.dispatch(new CreateNewPost(postDetails));
      this.clearForm();
      this.isPosting = false;
      this.router.navigate(["/profile"]);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  isFormValid(): boolean {
    const img: HTMLImageElement = document.getElementById('postImage') as HTMLImageElement;
    const captionInput: HTMLIonTextareaElement = document.getElementById('captionInput') as HTMLIonTextareaElement;
    const toggle: HTMLIonToggleElement = document.getElementById('toggleSale') as HTMLIonToggleElement;
    const categoryInput: HTMLIonInputElement = document.getElementById('categoryInput') as HTMLIonInputElement;
    const priceInput: HTMLIonInputElement = document.getElementById('numberInput') as HTMLIonInputElement;
    const fileInput: HTMLInputElement = document.getElementById('fileInput') as HTMLInputElement;

    if (img.src == "assets/icons/upload.png") {
      console.log("qqqqqqqqqqqqqqqqq1");
      return false;
    }
    if ((captionInput.value?.length && captionInput.value?.length < 4)) {
      console.log("qqqqqqqqqqqqqqqq2");
      return false;
    }
    if (toggle.checked && priceInput.value == "") {
      console.log("qqqqqqqqqqqqqqqqqqqqqq3");
      return false;
    }
    if (categoryInput.value == "") {
      console.log("qqqqqqqqqqqqqqqqqqqq4");
      return false;
    }
    if (fileInput.value == "") {
      console.log("qqqqqqqqqqqqqqqqqqqqqq5");
      return false;
    }
    return true;
  }

  clearForm() {
    const img: HTMLImageElement = document.getElementById('postImage') as HTMLImageElement;
    const captionInput: HTMLIonTextareaElement = document.getElementById('captionInput') as HTMLIonTextareaElement;
    const toggle: HTMLIonToggleElement = document.getElementById('toggleSale') as HTMLIonToggleElement;
    const categoryInput: HTMLIonInputElement = document.getElementById('categoryInput') as HTMLIonInputElement;
    const priceInput: HTMLIonInputElement = document.getElementById('numberInput') as HTMLIonInputElement;
    const priceGrid: HTMLElement = document.getElementById('priceGrid') as HTMLElement;
    const fileInput: HTMLInputElement = document.getElementById('fileInput') as HTMLInputElement;

    const emoji1 = document.getElementById('emoji1');
    const emoji2 = document.getElementById('emoji2');

    const oldHashtag: HTMLIonButtonElement | null = this.postDetailsForm?.get('hashtag')?.value ?
    document.getElementById(this.postDetailsForm?.get('hashtag')?.value?.slice(1) + 'Button') as HTMLIonButtonElement :
    null;

    if (oldHashtag && oldHashtag.style) {
      oldHashtag.style.filter = 'brightness(50%)';
    }

    if(emoji1) {emoji1.textContent = "😢No Hashtag😔";}
    if (emoji2) {emoji2.textContent = "😉Select One😊";}
    this.postDetailsForm?.get('hashtag')?.setValue("");
    priceGrid.style.display = 'none';
    img.src = "assets/icons/upload.png";
    captionInput.value = "";
    toggle.checked = false;
    categoryInput.value = "";
    priceInput.value = "";
    fileInput.value = "";
    //console.log("Cleared");
  }

  uploadImageAndReturnUrl(file: File): Promise<string> {
    this.isPosting = true;
    const filePath = `posts/${new Date().getTime()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    // Log the upload progress percentage
    task.percentageChanges().subscribe(progress => {
      console.log(`Upload progress: ${progress}%`);
    });

    return new Promise((resolve, reject) => {
      task.then(async () => {
        try {
          const url = await fileRef.getDownloadURL().toPromise();
          resolve(url);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }).catch(error => {
        console.error('Error uploading file:', error);
        reject(error);
      });
    });
  }


  get caption() {
    return this.postDetailsForm.get('caption');
  }

  get hashtag() {
    return this.postDetailsForm.get('hashtag');
  }

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  // uploadImage(file: File): Promise<string> {
  //   const filePath = `posts/${new Date().getTime()}_${file.name}`;
  //   const fileRef = this.storage.ref(filePath);
  //   const task = this.storage.upload(filePath, file);

  //   // Get the download URL once the file is uploaded
  //   return new Promise((resolve, reject) => {
  //     task.snapshotChanges().pipe(
  //       finalize(() => {
  //         fileRef.getDownloadURL().subscribe(
  //           (url) => resolve(url), // Resolve the promise with the URL
  //           (error) => reject(error) // Reject the promise with the error
  //         );
  //       })
  //     ).subscribe();
  //   });
  // }


  // async submitForm() {
  //   if (this.postDetailsForm.invalid) {
  //     console.log("Invalid");
  //     return;
  //   }

  //   const fileInput = this.fileInput.nativeElement as HTMLInputElement;
  //   if (fileInput.files && fileInput.files.length > 0) {
  //     try {
  //       const imageUrl = await this.uploadImage(fileInput.files[0]);
  //       this.createNewPost(imageUrl);
  //     } catch (error) {
  //       console.error('Error uploading image:', error);
  //     }
  //   } else {
  //     console.log("No file selected");
  //   }
  // }
  // createNewPost(url: string) {
  //   console.log("Trying to create");
  //   if (this.postDetailsForm.invalid) {
  //     console.log("Invalid");
  //     return;
  //   }

  //   const strCon = url;
  //   console.log("Content " + strCon);
  //   const postDetails: IPostDetails = {
  //     content: strCon,
  //     caption: this.postDetailsForm.get('caption')?.value,
  //     hashtag: stringToHashtag(this.postDetailsForm.get('hashtag')?.value),
  //     listing: this.postDetailsForm.get('listing')?.value
  //   };
  //   this.store.dispatch(new CreateNewPost(postDetails));
  // }


  onFileChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.postDetailsForm?.get('content')?.setValue(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };


  setHashtag(hashtag: string) {

    const newHashtag: HTMLIonButtonElement | null = document.getElementById(hashtag.slice(1) + 'Button') as HTMLIonButtonElement;

    const oldHashtag: HTMLIonButtonElement | null = this.postDetailsForm?.get('hashtag')?.value ?
    document.getElementById(this.postDetailsForm?.get('hashtag')?.value?.slice(1) + 'Button') as HTMLIonButtonElement :
    null;

    if (oldHashtag && oldHashtag.style) {
      oldHashtag.style.filter = 'brightness(50%)';
    }

    if (newHashtag && newHashtag.style) {
      newHashtag.style.filter = 'brightness(100%)';
    }

    let emoji = '';
    if (hashtag.includes('nature')) {
      emoji = '🌿';
    } else if (hashtag.includes('funny')) {
      emoji = '😂';
    } else if (hashtag.includes('opinion')) {
      emoji = '💬';
    } else if (hashtag.includes('music')) {
      emoji = '🎵';
    } else if (hashtag.includes('sports')) {
      emoji = '🏀';
    } else if (hashtag.includes('food')) {
      emoji = '🍔';
    }


    const emoji1 = document.getElementById('emoji1');
    if (emoji1) { emoji1.textContent = emoji; }
    const emoji2 = document.getElementById('emoji2');
    if (emoji2) { emoji2.textContent = emoji; }

    this.postDetailsForm?.get('hashtag')?.setValue(hashtag);


  }


  changeForSale() {
    // If the toggle is set to true, then make the component with id priceGrid visible, otherwise hide it
    const priceGrid: HTMLElement = document.getElementById('priceGrid') as HTMLElement;
    const toggle: HTMLIonToggleElement = document.getElementById('toggleSale') as HTMLIonToggleElement;
    console.log(toggle.checked);
    if (!toggle.checked) {
      priceGrid.style.display = 'block';
    }
    else {
      priceGrid.style.display = 'none';
    }
  }


  // get ageError(): string {
  //   if (this.age?.errors?.['required']) return 'Age is required';
  //   if (this.age?.errors?.['minlength'])
  //     return 'Age should be longer than 4 characters';
  //   if (this.age?.errors?.['maxlength'])
  //     return 'Age should be shorter than 64 characters';

  //   return 'Age is invalid';
  // }

  // get genderError(): string {
  //   if (this.gender?.errors?.['required']) return 'Gender is required';
  //   if (this.gender?.errors?.['minlength'])
  //     return 'Gender should be longer than 4 characters';
  //   if (this.gender?.errors?.['maxlength'])
  //     return 'Gender should be shorter than 64 characters';

  //   return 'Gender is invalid';
  // }

  // get ethnicityError(): string {
  //   if (this.ethnicity?.errors?.['required']) return 'Ethnicity is required';
  //   if (this.ethnicity?.errors?.['minlength'])
  //     return 'Ethnicity should be longer than 4 characters';
  //   if (this.ethnicity?.errors?.['maxlength'])
  //     return 'Ethnicity should be shorter than 64 characters';

  //   return 'Ethnicity is invalid';
  // }
  private profileSubscription!: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly store: Store,
    private storage: AngularFireStorage,
    private router: Router
  ) {this.profileSubscription = this.profile$.subscribe((profile) => {
    if (profile && profile.time === 0) {
      // User's time reached 0, log them out
      this.store.dispatch(new Logout());
    }
  });
}

ngOnDestroy() {
  // Clean up the subscription when the component is destroyed
  if (this.profileSubscription) {
    this.profileSubscription.unsubscribe();
  }
}

  createPostDetails() {
    console.log("here in component");
    this.store.dispatch(new CreatePostDetails());
  }

  setInsertionPoint() {
    const x = document.getElementById("numberInput") as HTMLIonInputElement;

    x.setFocus();
  }

  showError(message: string) {
    const errorMessage: HTMLDivElement = document.getElementById('error-message') as HTMLDivElement;
    errorMessage.innerHTML = `Error: ${message}`;
    errorMessage.classList.remove('hidden');
    setTimeout(this.hideError, 2000); // Hide error message after 2 seconds
  }

  hideError() {
    const errorMessage: HTMLDivElement = document.getElementById('error-message') as HTMLDivElement;
    errorMessage.classList.remove('slide-up');
    errorMessage.classList.add('slide-down');
    setTimeout(() => {
      errorMessage.classList.add('hidden');
      errorMessage.classList.remove('slide-down');
    }, 500);
  }

}
