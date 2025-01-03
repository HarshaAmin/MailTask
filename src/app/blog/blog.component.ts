import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  blogs = [
    {
      title: 'Harnessing AI for Smarter Email Solutions',
      description: 'Discover how AI transforms email strategies for better communication.',
      image: 'assets/blog1.jpg',
      link: '/blog/ai-email-solutions',
    },
    {
      title: 'Salesforce Tips for Better Customer Engagement',
      description: 'Leverage Salesforce to enhance your customer relationships.',
      image: 'assets/blog2.jpg',
      link: '/blog/salesforce-tips',
    },
    {
      title: 'The Future of Communication Technology',
      description: 'Explore upcoming trends in communication and collaboration.',
      image: 'assets/blog3.jpg',
      link: '/blog/future-communication',
    },
  ];

  constructor() {}

  ngOnInit() {}
}
