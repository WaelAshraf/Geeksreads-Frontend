import { Component, OnInit } from '@angular/core';
import { Titles_Service } from './profile-entity.service';
import { User } from './profile.model';
import { Subscription } from 'rxjs'
import { CdkOverlayOrigin } from '@angular/cdk/overlay';

@Component({
  selector: 'app-profile-entity',
  templateUrl: './profile-entity.component.html',
  styleUrls: ['./profile-entity.component.css']
})
export class ProfileEntityComponent implements OnInit {

  private Sub_profile: Subscription;

  User_info: User;            // user object contains user info
  user_cover_photo : string ;
  user_name :string;

  constructor(public Titles_Service: Titles_Service) { }  // constructor of that class

  ngOnInit() {                    // on initializing that class implement this function 

    this.Titles_Service.get_User_Info();                                  // to get the user info from the service
    this.Sub_profile = this.Titles_Service.get_User_Info_updated().       // once the class is initialized 
      subscribe((User_Information: User) => {                            //  supscripe the value recieved
        this.User_info = User_Information;
        this.user_cover_photo = this.User_info.User_Photo;
        this.user_name=this.User_info.User_Name;
         /*console.log(this.User_info.User_Name)
         console.log(this.User_info.user_id)
         console.log(this.User_info.User_Photo)*/
      });
  }

}
