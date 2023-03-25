import { IPost } from '@mp/api/postss/util';
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PostRepository {

  
  

  
  async findOne(profile: IPost) {
    if(profile.postID == ""){
      throw Error("No PostID");
    }
    return await admin
      .firestore()
      .collection('posts')
      .withConverter<IPost>({
        fromFirestore: (snapshot) => {
          return snapshot.data() as IPost;
        },
        toFirestore: (it: IPost) => it,
      })
      .doc(profile.postID)
      .get();
  }

  /*
  Returns posts created in the last week that has the greatest number of likes
  */
  async findTrendingByLikes(): Promise<IPost[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const querySnapshot = await admin
      .firestore()
      .collection('posts')
      .where('createdAt', '>', admin.firestore.Timestamp.fromDate(oneWeekAgo))
      .orderBy('likes', 'desc')
      .limit(30)
      .withConverter<IPost>({
        fromFirestore: (snapshot) => {
          return snapshot.data() as IPost;
        },
        toFirestore: (it: IPost) => it,
      })
      .get();

    const topPosts: IPost[] = [];
    querySnapshot.forEach((doc) => {
      topPosts.push(doc.data());
    });

    return topPosts;
  }

  /*Examples from profile

  async createProfile(profile: IPost) {
    // Remove password field if present
    delete profile.accountDetails?.password;
    return await admin
      .firestore()
      .collection('profiles')
      .doc(profile.userId)
      .create(profile);
  }

  async updateProfile(profile: IPost) {
    // Remove password field if present
    delete profile.accountDetails?.password;
    return await admin
      .firestore()
      .collection('profiles')
      .doc(profile.userId)
      .set(profile, { merge: true });
  }
  */
}
