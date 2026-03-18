export const mockTemplates = [
    {
        id: 1,
        name: "Insider Business Newsletter [Thursday June 6 2024]",
        created: "Today, 8:44am",
        modified: "Today, 8:44am",
        status: "Current",
        subject: "Your Weekly Business Update",
        blocks: [
            {
                id: 'block-1',
                type: 'header',
                content: 'INSIDER BUSINESS',
                style: {
                    fontSize: '34px',
                    fontWeight: 'bold',
                    color: '#000000',
                    textAlign: 'center',
                    fontFamily: 'Verdana, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }
            },
            {
                id: 'block-date',
                type: 'text',
                content: 'Thursday, June 6, 2024',
                style: {
                    fontSize: '12px',
                    color: '#666666',
                    textAlign: 'center',
                    fontFamily: 'Arial',
                    marginTop: '-15px'
                }
            },
            {
                id: 'block-2',
                type: 'spacer',
                height: 25
            },
            {
                id: 'block-img-main',
                type: 'image',
                label: 'Main Headline Image',
                styles: {}
            },
            {
                id: 'block-2b',
                type: 'spacer',
                height: 15
            },
            {
                id: 'block-3',
                type: 'header',
                content: 'Global Markets Rally',
                style: {
                    fontSize: '24px',
                    color: '#333333',
                    textAlign: 'left',
                    fontFamily: 'Georgia, serif',
                    fontWeight: 'bold'
                }
            },
            {
                id: 'block-4',
                type: 'text',
                content: 'Top stories this week include a significant upturn in global markets as tech stocks lead the charge. Investors are watching closely as new AI developments continue to drive growth sectors.',
                style: {
                    fontSize: '16px',
                    color: '#444444',
                    lineHeight: '1.6',
                    fontFamily: 'Arial',
                    textAlign: 'left'
                }
            },
            {
                id: 'block-5',
                type: 'spacer',
                height: 20
            },
            {
                id: 'block-6',
                type: 'button',
                text: 'Read Full Analysis',
                url: 'https://example.com/markets',
                style: {
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    padding: '12px 32px',
                    borderRadius: '0px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }
            }
        ]
    },
    {
        id: 2,
        name: "Finance Newsletter",
        created: "Fri May 31 2024, 5:25pm",
        modified: "Fri May 31 2024, 5:25pm",
        status: "Current",
        subject: "Your Monthly Finance Report",
        blocks: [
            {
                id: 'block-1',
                type: 'header',
                content: 'FINANCE FOCUS',
                style: {
                    fontSize: '30px',
                    fontWeight: '900',
                    color: '#27ae60',
                    textAlign: 'left',
                    fontFamily: 'Roboto, sans-serif'
                }
            },
            {
                id: 'block-line',
                type: 'line'
            },
            {
                id: 'block-2',
                type: 'spacer',
                height: 20
            },
            {
                id: 'block-3',
                type: 'text',
                content: 'Dear Client,',
                style: {
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    marginBottom: '10px'
                }
            },
            {
                id: 'block-4',
                type: 'text',
                content: 'We are pleased to present your monthly financial overview. This month saw a steady increase in portfolio performance across diverse sectors. Our strategy of balanced diversification continues to yield positive results despite market volatility.',
                style: {
                    fontSize: '16px',
                    color: '#34495e',
                    lineHeight: '1.6',
                    fontFamily: 'Arial',
                    backgroundColor: '#f9f9f9',
                    padding: '15px',
                    borderRadius: '5px'
                }
            },
            {
                id: 'block-5',
                type: 'spacer',
                height: 25
            },
            {
                id: 'block-6',
                type: 'button',
                text: 'Access Your Dashboard',
                url: 'https://portal.example.com/login',
                style: {
                    backgroundColor: '#27ae60',
                    color: '#ffffff',
                    padding: '14px 40px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '16px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }
            }
        ]
    },
    {
        id: 3,
        name: "May 2024 - General Residential Newsletter",
        created: "Tue May 28 2024, 9:00am",
        modified: "Tue May 28 2024, 9:05am",
        status: "Current",
        subject: "Your Community Update - May 2024",
        blocks: [
            {
                id: 'block-1',
                type: 'header',
                content: 'COMMUNITY PULSE',
                style: {
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#2c3e50',
                    textAlign: 'center',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    letterSpacing: '-1px',
                    textTransform: 'uppercase'
                }
            },
            {
                id: 'block-2',
                type: 'text',
                content: 'MAY 2024 EDITION',
                style: {
                    fontSize: '14px',
                    color: '#95a5a6',
                    textAlign: 'center',
                    fontFamily: 'Arial',
                    marginTop: '-10px',
                    letterSpacing: '2px'
                }
            },
            {
                id: 'block-3',
                type: 'spacer',
                height: 30
            },
            {
                id: 'block-image-1',
                type: 'image',
                label: 'Community Header Image',
                styles: {}
            },
            {
                id: 'block-4',
                type: 'spacer',
                height: 20
            },
            {
                id: 'block-5',
                type: 'text',
                content: 'Hello Neighbor,',
                style: {
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#34495e',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-6',
                type: 'text',
                content: 'Spring is in full swing, and our neighborhood is buzzing with activity! From the upcoming street fair to the new park opening, there is so much to look forward to this month.',
                style: {
                    fontSize: '16px',
                    color: '#555555',
                    lineHeight: '1.6',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-7',
                type: 'spacer',
                height: 15
            },
            {
                id: 'block-8',
                type: 'header',
                content: 'Upcoming Events',
                style: {
                    fontSize: '24px',
                    color: '#e67e22',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    borderBottom: '2px solid #f39c12',
                    paddingBottom: '10px'
                }
            },
            {
                id: 'block-9',
                type: 'text',
                content: '• May 15th: Annual Charity Run\n• May 22nd: Farmers Market Opening\n• May 29th: Local Jazz Festival',
                style: {
                    fontSize: '16px',
                    color: '#555555',
                    lineHeight: '1.8',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-10',
                type: 'spacer',
                height: 30
            },
            {
                id: 'block-11',
                type: 'button',
                text: 'View Full Calendar',
                url: 'https://community.example.com/events',
                style: {
                    backgroundColor: '#e67e22',
                    color: '#ffffff',
                    padding: '14px 36px',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                }
            }
        ]
    },
    {
        id: 4,
        name: "Insider Residential Newsletter [Thursday May 30 2024]",
        created: "Tue May 28 2024, 8:59am",
        modified: "Tue May 28 2024, 8:59am",
        status: "Current",
        subject: "Residential Insider Updates",
        blocks: [
            {
                id: 'block-1',
                type: 'header',
                content: 'RESIDENTIAL INSIDER',
                style: {
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    textAlign: 'left',
                    fontFamily: 'Playfair Display, serif',
                    borderBottom: '4px solid #16a085',
                    paddingBottom: '10px'
                }
            },
            {
                id: 'block-2',
                type: 'spacer',
                height: 20
            },
            {
                id: 'block-intro-text',
                type: 'text',
                content: 'Exclusive property insights and market trends for the discerning homeowner.',
                style: {
                    fontSize: '16px',
                    color: '#7f8c8d',
                    fontStyle: 'italic',
                    fontFamily: 'Georgia, serif'
                }
            },
            {
                id: 'block-3',
                type: 'spacer',
                height: 30
            },
            {
                id: 'block-feat-img',
                type: 'image',
                label: 'Luxury Home Feature',
                styles: {}
            },
            {
                id: 'block-4',
                type: 'header',
                content: 'Market Watch: Trends to Watch',
                style: {
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#34495e',
                    marginTop: '20px',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-5',
                type: 'text',
                content: 'The property market is showing resilience this quarter. We are seeing a 5% uptick in demand for suburban family homes, while city center apartments remain stable. Now might be the perfect time to evaluate your property\'s worth.',
                style: {
                    fontSize: '16px',
                    color: '#333333',
                    lineHeight: '1.6',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-6',
                type: 'spacer',
                height: 25
            },
            {
                id: 'block-7',
                type: 'button',
                text: 'Get Your Property Appraisal',
                url: 'https://agency.example.com/appraisal',
                style: {
                    backgroundColor: '#16a085',
                    color: '#ffffff',
                    padding: '16px 0',
                    width: '100%',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                }
            },
            {
                id: 'block-8',
                type: 'spacer',
                height: 20
            },
            {
                id: 'block-footer',
                type: 'text',
                content: '123 Real Estate Ave, Property City. Contact us: (555) 123-4567',
                style: {
                    fontSize: '12px',
                    color: '#bdc3c7',
                    textAlign: 'center',
                    fontFamily: 'Arial',
                    marginTop: '20px'
                }
            }
        ]
    },
    {
        id: 5,
        name: "RBA Update - May 2024",
        created: "Tue May 7 2024, 2:32pm",
        modified: "Tue May 7 2024, 2:32pm",
        status: "Current",
        subject: "RBA Policy Update - May 2024",
        blocks: [
            {
                id: 'block-1',
                type: 'header',
                content: 'RBA Update',
                style: {
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#c0392b',
                    textAlign: 'center',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-2',
                type: 'spacer',
                height: 20
            },
            {
                id: 'block-3',
                type: 'text',
                content: 'Important updates from the Reserve Bank regarding monetary policy and economic outlook.',
                style: {
                    fontSize: '16px',
                    color: '#2c3e50',
                    lineHeight: '1.6',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-4',
                type: 'spacer',
                height: 25
            },
            {
                id: 'block-5',
                type: 'button',
                text: 'View Full Report',
                url: 'https://example.com/rba',
                style: {
                    backgroundColor: '#c0392b',
                    color: '#ffffff',
                    padding: '12px 28px',
                    borderRadius: '4px',
                    textAlign: 'center'
                }
            }
        ]
    },
    {
        id: 6,
        name: "Insider Business Newsletter [Thursday May 2 2024]",
        created: "Tue Apr 30 2024, 7:57am",
        modified: "Tue Apr 30 2024, 7:57am",
        status: "Current",
        subject: "Business Insights - May Edition",
        blocks: [
            {
                id: 'block-1',
                type: 'header',
                content: 'Business Insights',
                style: {
                    fontSize: '30px',
                    fontWeight: 'bold',
                    color: '#2980b9',
                    textAlign: 'center',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-2',
                type: 'spacer',
                height: 20
            },
            {
                id: 'block-3',
                type: 'text',
                content: 'Discover the latest business strategies and market opportunities in this month\'s edition.',
                style: {
                    fontSize: '16px',
                    color: '#34495e',
                    lineHeight: '1.5',
                    fontFamily: 'Arial'
                }
            }
        ]
    },
    {
        id: 7,
        name: "April 2024 - General Residential Newsletter",
        created: "Mon Apr 22 2024, 8:42am",
        modified: "Mon Apr 22 2024, 11:38am",
        status: "Archived",
        subject: "April Community Highlights",
        blocks: [
            {
                id: 'block-1',
                type: 'header',
                content: 'April Highlights',
                style: {
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#8e44ad',
                    textAlign: 'center',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-2',
                type: 'spacer',
                height: 25
            },
            {
                id: 'block-3',
                type: 'text',
                content: 'A recap of April\'s most important community events and announcements.',
                style: {
                    fontSize: '15px',
                    color: '#555555',
                    lineHeight: '1.6',
                    fontFamily: 'Arial'
                }
            },
            {
                id: 'block-4',
                type: 'line'
            }
        ]
    }
];
