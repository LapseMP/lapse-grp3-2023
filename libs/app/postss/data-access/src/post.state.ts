import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import {
  Hashtag,
  IPost,
  IPosts
} from '@mp/api/postss/util';
import { AuthState } from '@mp/app/auth/data-access';
import { Logout as AuthLogout } from '@mp/app/auth/util';
import { SetError } from '@mp/app/errors/util';
import { Timestamp } from 'firebase-admin/firestore';
import {
  SetPosts,
  SetPost
} from '@mp/app/postss/util';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import produce from 'immer';
import { tap } from 'rxjs';
import { PostApi } from './post.api';
import { SubscribeToPost } from '@mp/app/postss/util';

// eslint-disable-next-line @typescript-eslint/no-empty-interface

/*
Array of Post objects
*/
export interface PostsStateModel {
  posts: IPosts | null;
  postsDetailsForm: {
    model: {
      posts: IPost[] | null
    };
    dirty: false;
    status: string;
    errors: object;
  };
}

/*
Individual Post State Model
*/

export interface PostStateModel {
  post: IPost | null;
  postDetailsForm: {
    model: {
      postID: string;
      createdBy: string;
      ownedBy: string | null | undefined;
      createdAt?: Timestamp | null | undefined;
      content?: string | null | undefined;
      hashtag?: Hashtag | null | undefined;
      caption?: string | null | undefined;
      totalTime?: number | null | undefined
      ownerGainedTime?: number | null | undefined
      listing?: number | null | undefined

    };
    dirty: false;
    status: string;
    errors: object;
  };
}

@State<PostsStateModel>({
  name: 'posts',
  defaults: {
    posts: null,
    postsDetailsForm: {
      model: {
        posts: null
      },
      dirty: false,
      status: '',
      errors: {},
    }
  }
})

@State<PostStateModel>({
  name: 'post',
  defaults: {
    post: null,
    postDetailsForm: {
      model: {
        postID: '',
        createdBy: '',
        ownedBy: null,
        createdAt: null,
        content: '',
        hashtag: null,
        caption: '',
        totalTime: 0,
        ownerGainedTime: 0,
        listing: null
      },
      dirty: false,
      status: '',
      errors: {},
    }
  }
})
@Injectable()
export class PostsState {
  constructor(
    private readonly postApi: PostApi,
    private readonly store: Store
  ) { }

  @Selector()
  static posts(state: PostsStateModel) {
    return state.posts;
  }

  @Selector()
  static post(state: PostStateModel) {
    return state.post;
  }

//This function will subscribe to the current posts that are loaded
  @Action(SubscribeToPost)
  subscribeToPosts(ctx: StateContext<PostsStateModel>) {
    const postsToLook = this.store.selectSnapshot(PostsState.posts);
    if (!postsToLook || postsToLook.posts == null) return ctx.dispatch(new SetError('Posts not Set'));

    // Subscribe to changes in each post
    postsToLook.posts.forEach((post: IPost) => {
      this.postApi
        .post$(post.postID)
        .pipe(
          map((updatedPost: IPost) => {
            // Update the PostsState and internal PostState
            const postsInt = ctx.getState().posts;
            if (postsInt && postsInt.posts != null) {
              const index = postsInt.posts.findIndex(p => p.postID === updatedPost.postID);
              if (index !== -1) {
                postsInt.posts[index] = updatedPost;
                ctx.patchState({ posts: postsInt });
              }
            }
            return updatedPost;
          }),
          tap((updatedPost: IPost) => {
            const postState = this.store.selectSnapshot(PostsState.post);
            if (postState && postState.postID === updatedPost.postID) {
              ctx.dispatch(new SetPost(updatedPost));
            }
          })
        )
        .subscribe();
    });

  }

  @Action(SetPosts)
  setPosts(ctx: StateContext<PostsStateModel>, { posts }: SetPosts) {
    return ctx.setState(
      produce((draft) => {
        draft.posts = posts;
      })
    );
  }

  @Action(SetPost)
  setPost(ctx: StateContext<PostStateModel>, { post }: SetPost) {
    return ctx.setState(
      produce((draft) => {
        draft.post = post;
      })
    );
  }



  /*

  Examples from profile, remove later

  @Action(SetProfile)
  setProfile(ctx: StateContext<ProfileStateModel>, { profile }: SetProfile) {
    return ctx.setState(
      produce((draft) => {
        draft.profile = profile;
      })
    );
  }

  @Action(UpdateAccountDetails)
  async updateAccountDetails(ctx: StateContext<ProfileStateModel>) {
    try {
      const state = ctx.getState();
      const userId = state.profile?.userId;
      const displayName = state.accountDetailsForm.model.displayName;
      const email = state.accountDetailsForm.model.email;
      // const photoURL = state.accountDetailsForm.model.photoURL;
      const password = state.accountDetailsForm.model.password;

      if (!userId || !displayName || !email || !password)
        return ctx.dispatch(
          new SetError(
            'UserId or display name or email or photo URL or password not set'
          )
        );

      const request: IUpdateAccountDetailsRequest = {
        profile: {
          userId,
          accountDetails: {
            displayName,
            email,
            password,
          },
        },
      };
      const responseRef = await this.profileApi.updateAccountDetails(request);
      const response = responseRef.data;
      return ctx.dispatch(new SetProfile(response.profile));
    } catch (error) {
      return ctx.dispatch(new SetError((error as Error).message));
    }
  }
  */
}



