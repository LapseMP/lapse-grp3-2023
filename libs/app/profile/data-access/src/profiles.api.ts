import { Injectable } from '@angular/core';
import { collection, doc, docData, Firestore, collectionData } from '@angular/fire/firestore';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
    IProfile,
    IPostDetails,
    IAddPostRequest,
    IAddPostResponse,
    IUpdateAccountDetailsRequest,
    IUpdateAccountDetailsResponse,
    IUpdateAddressDetailsRequest,
    IUpdateAddressDetailsResponse,
    IUpdateContactDetailsRequest,
    IUpdateContactDetailsResponse,
    IUpdateOccupationDetailsRequest,
    IUpdateOccupationDetailsResponse,
    IUpdatePersonalDetailsRequest,
    IUpdatePersonalDetailsResponse,
    ICreatePostResponse,
    ICreatePostRequest,
    ICommentOnPostResponse,
    ICommentOnPostRequest
} from '@mp/api/profiles/util';
import { Observable, combineLatest, from, map } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

@Injectable()
export class ProfilesApi {
  constructor(
    private readonly firestore: Firestore,
    private readonly functions: Functions,
    private firestore1: AngularFirestore,
    private http: HttpClient, public functions2: AngularFireFunctions
  ) {}

  profile$(id: string) {
    const docRef = doc(
      this.firestore,
      `profiles/${id}`
    ).withConverter<IProfile>({
      fromFirestore: (snapshot) => {
        return snapshot.data() as IProfile;
      },
      toFirestore: (it: IProfile) => it,
    });

    const profile$ = docData(docRef, { idField: 'id' });

    const postsRef = collection(
      this.firestore,
      `profiles/${id}/posts`
    ).withConverter<IPostDetails>({
      fromFirestore: (snapshot) => {
        return snapshot.data() as IPostDetails;
      },
      toFirestore: (it: IPostDetails) => it,
    });

    const posts$ = collectionData(postsRef, { idField: 'id' });

    return combineLatest([profile$, posts$]).pipe(
      map(([profile, posts]) => ({
        ...profile,
        posts,
      }))
    );
  }

  getUserPostsFromFunction$(displayName: string): Observable<IPostDetails[]> {
    const getUserPosts = this.functions2.httpsCallable('getUserPostsByEmail');
    return from(getUserPosts({ displayName })).pipe(map(result => result.posts));
  }

  getPortfolioPostsFromFunction$(userId: string):Observable<IPostDetails[]> {
    const getUserPosts = this.functions2.httpsCallable('getUserPortfolio');
    return from(getUserPosts({ userId })).pipe(map(result => result.posts));
  }

buyPost$(post:IPostDetails,buyer:string): Observable<IPostDetails[]> {
  const buyPost = this.functions2.httpsCallable('buyPost');
  return from(buyPost({ post,buyer })).pipe(map(result => result.posts));
}

getAllPosts$(userId: string):Observable<IPostDetails[]>{
console.log("in api");
  const getAllPosts = this.functions2.httpsCallable('getAllPosts');
console.log(getAllPosts);
  console.log( from(getAllPosts( {userId} )).pipe(map(result => result.posts)));
return from(getAllPosts( {userId} )).pipe(map(result => result.posts));
}

getUserPostsByHashtag$(hashtag: string): Observable<IPostDetails[]> {
  console.log("testing get by hashtag. in profile.api.ts");
  const getUserPostsByHashtag = this.functions2.httpsCallable('getUserPostsByHashtag');
  return from(getUserPostsByHashtag({ hashtag })).pipe(map(result => result.posts));
}

setPhoto$(userId: string, photoURL: string): Observable<IProfile> {
  const setPhoto = this.functions2.httpsCallable('setPhoto');
  return from(setPhoto({ userId, photoURL })).pipe(map(result => result.profile));
}



  // profile$(id: string) {
  //   const profileDocRef = doc(
  //     this.firestore,
  //     `profiles/${id}`
  //   ).withConverter<IProfile>({
  //     fromFirestore: (snapshot) => {
  //       return snapshot.data() as IProfile;
  //     },
  //     toFirestore: (it: IProfile) => it,
  //   });

  //   const postsCollectionRef = collection(
  //     this.firestore,
  //     `profiles/${id}/posts`
  //   ).withConverter<IPostDetails>({
  //     fromFirestore: (snapshot) => {
  //       return snapshot.data() as IPostDetails;
  //     },
  //     toFirestore: (it: IPostDetails) => it,
  //   });

  //   return combineLatest([
  //     docData(profileDocRef, { idField: 'id' }),
  //     collectionData(postsCollectionRef, { idField: 'id' }),
  //   ]).pipe(
  //     map(([profile, posts]) => {
  //       return { ...profile, posts } as IProfile;
  //     })
  //   );

  // }


  async updateAccountDetails(request: IUpdateAccountDetailsRequest) {
    return await httpsCallable<
      IUpdateAccountDetailsRequest,
      IUpdateAccountDetailsResponse
    >(
      this.functions,
      'updateAccountDetails'
    )(request);
  }



  async createPostDetails(request: ICreatePostRequest) {
    return await httpsCallable<
    ICreatePostRequest,
    ICreatePostResponse
    >(
      this.functions,
      'createPostDetails'
    )(request);
  }

  async CreateNewComment(request: ICommentOnPostRequest) {
    console.log(JSON.stringify(request));
    return await httpsCallable<
    ICommentOnPostRequest,
    ICommentOnPostResponse
    >(
      this.functions,
      'createNewComment1'
    )(request);
  }

  async addPostDetails(request: IAddPostRequest) {
    console.log(JSON.stringify(request));
    return await httpsCallable<
    IAddPostRequest,
    IAddPostResponse
    >(
      this.functions,
      'addPost'
    )(request);
  }

  async updateContactDetails(request: IUpdateContactDetailsRequest) {
    return await httpsCallable<
      IUpdateContactDetailsRequest,
      IUpdateContactDetailsResponse
    >(
      this.functions,
      'updateContactDetails'
    )(request);
  }

  async updateAddressDetails(request: IUpdateAddressDetailsRequest) {
    return await httpsCallable<
      IUpdateAddressDetailsRequest,
      IUpdateAddressDetailsResponse
    >(
      this.functions,
      'updateAddressDetails'
    )(request);
  }

  async updatePersonalDetails(request: IUpdatePersonalDetailsRequest) {
    return await httpsCallable<
      IUpdatePersonalDetailsRequest,
      IUpdatePersonalDetailsResponse
    >(
      this.functions,
      'updatePersonalDetails'
    )(request);
  }

  async updateOccupationDetails(request: IUpdateOccupationDetailsRequest) {
    return await httpsCallable<
      IUpdateOccupationDetailsRequest,
      IUpdateOccupationDetailsResponse
    >(
      this.functions,
      'updateOccupationDetails'
    )(request);
  }

  likePost$(post:IPostDetails,liker:string): Observable<IPostDetails[]> {
    const likePost = this.functions2.httpsCallable('likePost');
    return from(likePost({ post,liker })).pipe(map(result => result.posts));
  }

}
