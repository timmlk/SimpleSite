SimpleSite
============

Simple site build in Node.js with express, passport and mongo.

Description
-------------
Very simple site with a rest like interface. 


TODO
------
Refac to use Q.js
Paging 

Categories for icons and articles
Refac painting and Doc views to use same view templates wehere possible
menu, based on categories
Check for code duplication, refac multiformparser so that it and passport doesent have the same functionality.



DONE : 
Get rid of that pesky session... we dont like session data. 
    This would/should also enable clustering of the app.
Icon datatype
    Made as painting model    


NOTES
Remeber to set bucket policy to public read 
{
  "Version":"2008-10-17",
  "Statement":[{
    "Sid":"AddPerm",
        "Effect":"Allow",
      "Principal": {
            "AWS": "*"
         },
      "Action":["s3:GetObject"],
      "Resource":["arn:aws:s3:::bucket/*"
      ]
    }
  ]
}

Remember to enable cors <AllowedMethod>POST</AllowedMethod> for your domain
    It seems that S3 still has a problem handling OPTION requests for CORS

Direct upload requires s3:putObjectACL for the user that signs the policy for the request   