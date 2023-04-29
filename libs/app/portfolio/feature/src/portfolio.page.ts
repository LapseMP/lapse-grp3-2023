import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { ProfileState } from '@mp/app/profile/data-access';
import { Observable } from 'rxjs';
import { IPostDetails, IProfile } from '@mp/api/profiles/util';
import { FetchPortfolioPosts} from '@mp/app/profile/util';


@Component({
  selector: 'mp-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
})
export class PortfolioPage implements OnInit {

  constructor(private router: Router, private store: Store) { }
  @Select(ProfileState.profile) profile$!: Observable<IProfile | null>;
  @Select(ProfileState.profilePosts) profilePosts$: Observable<IPostDetails[]> | undefined;
  userID = '';// need to find a way to get current user ID

  ngOnInit() {
    const userId='';
    console.log("here");
    this.store.dispatch(new FetchPortfolioPosts(userId));
   }


  //  getThePosts()
  //  {
  //     return this.store.dispatch(new getPortfolioPostsFromFunction(this.userID));

  //  }

  
  toHomePage() {
    this.router.navigate(["/home"]);
  }

  toSearchPage() {
    this.router.navigate(["/search"]);
  }
  toCreatePage() {
    this.router.navigate(["/create"]);
  }
  toPortfolioPage() {
    this.router.navigate(["/portfolio"]);
  }
  toProfilePage() {
    this.router.navigate(["/profile"]);
  }
}
