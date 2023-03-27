import { Timestamp } from 'firebase-admin/firestore';
import { AggregateRoot } from '@nestjs/cqrs';
import {Hashtag, IComment, IPost, PostCreatedEvent} from '@mp/api/postss/util';
import {PostRepository} from "@mp/api/postss/data-access";

export class Post extends AggregateRoot implements IPost {
    constructor(
        public postID: string,
        public createdBy: string,
        public likes: number, //fixed like left out
        public ownedBy: string | null | undefined,
        public buyerID?: string| null,
        public comments?: IComment[] | null,
        public createdAt?: Timestamp | null | undefined,
        public content?: string | null | undefined,
        public hashtag?: Hashtag | null |undefined,
        public caption? : string | null | undefined,
        public totalTime? : number | null | undefined,
        public ownerGainedTime?: number | null | undefined,
        public listing? : number | null | undefined
    ) {
        super();
    }

    static fromData(post: IPost): Post {
        const instance = new Post(
            post.postID,
            post.createdBy,
            post.likes,
            post.buyerID,
            post.ownedBy,
            post.comments,
            post.createdAt,
            post.content,
            post.hashtag,
            post.caption,
            post.totalTime,
            post.ownerGainedTime,
            post.listing,
        );
        return instance;
      }

      create(){
        this.apply(new PostCreatedEvent(this.toJSON()));
      }


      toJSON(): IPost {
        return {
          postID: this.postID,
          createdBy: this.createdBy,
          likes: this.likes,
          ownedBy: this.ownedBy,
          createdAt: this.createdAt,
          content: this.content,
          hashtag: this.hashtag,
          caption: this.caption,
          totalTime: this.totalTime,
          ownerGainedTime: this.ownerGainedTime,
          listing: this.listing,
        };
      }
}