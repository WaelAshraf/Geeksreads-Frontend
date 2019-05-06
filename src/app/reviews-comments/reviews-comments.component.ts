import { Component, OnInit, Input } from '@angular/core';
import { CommentsDetails } from './reviews-comments.model';
import { Subscription } from 'rxjs';
import { CommentsDetails_Service } from './reviews-comments.service';
@Component({
  selector: 'app-reviews-comments',
  templateUrl: './reviews-comments.component.html',
  styleUrls: ['./reviews-comments.component.css']
})
export class ReviewsCommentsComponent implements OnInit {
str: string;
@Input() ReviewID: string;
@Input() BookID: string;
////////////////////////////////////////////////
private Sub_profile: Subscription;
public comment_details: CommentsDetails[] = [];
/////////////////////////////////////////////////
constructor(public comments_service: CommentsDetails_Service) { }
  ngOnInit() {
    this.comments_service.get_comments_Info(this.ReviewID);                                  // to get the user info from the service
    // tslint:disable-next-line:variable-name
    this.Sub_profile = this.comments_service.get_comments_Info_updated().subscribe((comments_Information: CommentsDetails[]) => {
      this.comment_details = comments_Information;
    });
  }
  SendComment() {
    console.log(this.str);
    this.comments_service.post_Comment(this.str, this.ReviewID, this.BookID);
    this.str = '';
    location.reload();
  }
  GetCommentsUpdated() {
    this.comments_service.get_comments_Info(this.ReviewID);                                  // to get the user info from the service
    // tslint:disable-next-line:variable-name
    this.Sub_profile = this.comments_service.get_comments_Info_updated().subscribe((comments_Information: CommentsDetails[]) => {
      this.comment_details = comments_Information;
    });
  }
}
