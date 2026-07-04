/**
 * LinkedInMCP - Advanced LinkedIn Client
 * 
 * @author Dishant Kumar
 * @description Innovative LinkedIn API client with intelligent data retrieval
 * @created 2025
 * @version 1.0.0
 * 
 * This module represents a cutting-edge approach to LinkedIn data interaction,
 * developed to provide developers with powerful, context-aware API capabilities.
 */

import LinkedInAuth from './auth';
import axios from 'axios';
import puppeteer from 'puppeteer';
import * as path from 'path';

// Innovative interface definitions with creator's unique touch
interface SearchPeopleParams {
  keywords?: string;
  currentCompany?: string[];
  industries?: string[];
  location?: string;
}

interface GetProfileParams {
  publicId?: string;
  urnId?: string;
}

interface SearchJobsParams {
  keywords?: string;
  companies?: string[];
  location?: string;
  jobType?: string[];
}

interface SendMessageParams {
  recipientUrn: string;
  messageBody: string;
}

/**
 * LinkedInClient - Revolutionizing Professional Network Data Retrieval
 * 
 * Developed by Dishant Kumar to provide an intelligent, flexible 
 * approach to LinkedIn data interactions.
 */
class LinkedInClient {
  // Private properties with advanced security
  private auth: LinkedInAuth;
  private baseUrl = 'https://api.linkedin.com/v2';
  
  // Innovative request tracking
  private requestCount: number = 0;
  private lastRequestTimestamp: number | null = null;

  constructor(auth: LinkedInAuth) {
    this.auth = auth;
    this.logClientInitialization();
  }

  /**
   * Advanced request method with intelligent error handling
   * Showcasing Dishant Kumar's innovative approach to API interactions
   */
  private async makeRequest<T>(method: 'get' | 'post', endpoint: string, data?: any, extraHeaders?: any): Promise<T> {
    try {
      // Increment request tracking
      this.requestCount++;
      this.lastRequestTimestamp = Date.now();

      // Check if token is expiring soon and refresh if needed
      if (this.auth.isTokenExpiringSoon()) {
        await this.auth.authenticate();
      }

      // Intelligent request configuration
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.auth.getAccessToken()}`,
          'Content-Type': 'application/json',
          'x-li-format': 'json',
          'X-DishantMCP-RequestID': `REQ_${this.requestCount}`,
          ...extraHeaders
        },
        data
      });

      // Log successful request
      this.logSuccessfulRequest(endpoint);

      return response.data;
    } catch (error: any) {
      // Advanced error handling
      this.handleRequestError(error, endpoint);
      throw error;
    }
  }

  /**
   * Search for people on LinkedIn with advanced filtering
   */
  public async searchPeople(params: SearchPeopleParams): Promise<any> {
    // Build query parameters for search
    const queryParams = new URLSearchParams();
    
    if (params.keywords) {
      queryParams.append('keywords', params.keywords);
    }
    
    if (params.location) {
      queryParams.append('location', params.location);
    }
    
    // Current company filters
    if (params.currentCompany && params.currentCompany.length > 0) {
      params.currentCompany.forEach((company, index) => {
        queryParams.append(`current-company[${index}]`, company);
      });
    }
    
    // Industry filters
    if (params.industries && params.industries.length > 0) {
      params.industries.forEach((industry, index) => {
        queryParams.append(`facet-industry[${index}]`, industry);
      });
    }
    
    // Make the request
    return this.makeRequest<any>('get', `/search/people?${queryParams.toString()}`);
  }

  /**
   * Get a LinkedIn profile by public ID or URN ID
   */
  public async getProfile(params: GetProfileParams): Promise<any> {
    if (!params.publicId && !params.urnId) {
      throw new Error('Either publicId or urnId must be provided');
    }
    
    let endpoint = '';
    
    if (params.publicId) {
      endpoint = `/people/${params.publicId}`;
    } else if (params.urnId) {
      endpoint = `/people/${encodeURIComponent(params.urnId)}`;
    }
    
    // Add profile fields to include
    endpoint += '?projection=(id,firstName,lastName,profilePicture,headline,summary,industry,location,positions,educations,skills)';
    
    return this.makeRequest<any>('get', endpoint);
  }

  /**
   * Search for jobs on LinkedIn with advanced filtering
   */
  public async searchJobs(params: SearchJobsParams): Promise<any> {
    // Build query parameters for job search
    const queryParams = new URLSearchParams();
    
    if (params.keywords) {
      queryParams.append('keywords', params.keywords);
    }
    
    if (params.location) {
      queryParams.append('location', params.location);
    }
    
    // Company filters
    if (params.companies && params.companies.length > 0) {
      params.companies.forEach((company, index) => {
        queryParams.append(`company-name[${index}]`, company);
      });
    }
    
    // Job type filters
    if (params.jobType && params.jobType.length > 0) {
      params.jobType.forEach((type, index) => {
        queryParams.append(`job-type[${index}]`, type);
      });
    }
    
    // Make the request
    return this.makeRequest<any>('get', `/jobs/search?${queryParams.toString()}`);
  }

  /**
   * Send a message to a LinkedIn connection
   */
  public async sendMessage(params: SendMessageParams): Promise<any> {
    return this.sendMessageViaPuppeteer(params.recipientUrn, params.messageBody);
  }

  /**
   * Browser-automated message delivery for reliable execution
   */
  public async sendMessageViaPuppeteer(recipient: string, messageBody: string): Promise<any> {
    console.error('🚀 Launching Puppeteer browser for messaging...');
    const browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      defaultViewport: null,
      userDataDir: path.join(__dirname, '../user_data'),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      console.error('🌐 Navigating to login check...');
      try {
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (e) {
        console.error('⚠️ Login page load timed out, checking status...');
      }

      const isLoginPage = await page.evaluate(() => {
        return !!document.querySelector('#username');
      });

      if (isLoginPage) {
        console.error('✏️ Logging in via credentials...');
        await page.type('#username', process.env.LINKEDIN_EMAIL || '');
        await page.type('#password', process.env.LINKEDIN_PASSWORD || '');
        await Promise.all([
          page.click('.btn__primary--large'),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.error('Navigation took long...'))
        ]);
      } else {
        console.error('✅ Already logged in (skipped credentials typing)!');
      }

      // Check if recipient is a URN (e.g. urn:li:person:ID) or a publicIdentifier/profile URL
      let recipientPublicId = recipient;
      if (recipient.startsWith('urn:li:')) {
        console.error('🔍 Resolving member URN to publicIdentifier...');
        try {
          const connections = await this.getConnections();
          const targetId = recipient.split(':').pop();
          const elements = connections.elements || [];
          const match = elements.find((c: any) => {
            const memberId = c.miniProfile?.objectUrn?.split(':').pop();
            return memberId === targetId;
          });
          if (match && match.miniProfile?.publicIdentifier) {
            recipientPublicId = match.miniProfile.publicIdentifier;
            console.error(`✅ Resolved URN to publicIdentifier: ${recipientPublicId}`);
          }
        } catch (e) {
          console.error('⚠️ Connections list lookup failed, using recipient URN directly:', e);
        }
      } else if (recipient.includes('linkedin.com/in/')) {
        const parts = recipient.split('/in/');
        if (parts.length > 1) {
          recipientPublicId = parts[1].replace(/\/$/, '');
        }
      }

      console.error(`🌐 Navigating to thread URL for recipient: ${recipientPublicId}`);
      try {
        await page.goto(`https://www.linkedin.com/messaging/thread/new?recipient=${recipientPublicId}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch (e) {
        console.error('⚠️ Thread page load took longer than 20s, proceeding anyway...');
      }

      console.error('💬 Message window opened. Typing message...');
      const messageAreaSelector = '.msg-form__contenteditable[contenteditable="true"], textarea[name="message"]';
      await page.waitForSelector(messageAreaSelector, { timeout: 15000 });
      await page.focus(messageAreaSelector);
      await page.keyboard.type(messageBody);

      console.error('📤 Clicking send...');
      const sendClicked = await page.evaluate(() => {
        const sendBtn = document.querySelector('button.msg-form__send-button, button[type="submit"]') as any;
        if (sendBtn) {
          sendBtn.click();
          return true;
        }
        return false;
      });

      if (!sendClicked) {
        throw new Error('Could not find Send button');
      }

      console.error('🎉 Message sent successfully!');
      await new Promise(r => setTimeout(r, 3000));
      return { success: true, recipient: recipientPublicId, message: messageBody };
    } finally {
      await browser.close();
    }
  }

  /**
   * Get the current user's LinkedIn profile
   */
  public async getMyProfile(): Promise<any> {
    try {
      // Try the modern OpenID Connect userinfo endpoint first
      return await this.makeRequest<any>('get', '/userinfo');
    } catch (error: any) {
      // Fallback to legacy /me endpoint if /userinfo is not authorized or not found
      if (error.response?.status === 403 || error.response?.status === 404) {
        return this.makeRequest<any>('get', '/me?projection=(id,firstName,lastName,profilePicture,headline)');
      }
      throw error;
    }
  }

  /**
   * Get the current user's network statistics
   */
  public async getNetworkStats(): Promise<any> {
    return this.makeRequest<any>('get', '/networkSizes/~');
  }

  /**
   * Get the user's LinkedIn connections
   */
  public async getConnections(): Promise<any> {
    return this.makeRequest<any>('get', '/connections?start=0&count=50');
  }

  /**
   * Create a text or link post on LinkedIn
   */
  public async createPost(params: {
    text: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS';
    originalUrl?: string;
    title?: string;
    description?: string;
  }): Promise<any> {
    // Get the current user URN
    const profile = await this.getMyProfile();
    const authorUrn = profile.sub ? `urn:li:person:${profile.sub}` : `urn:li:person:${profile.id}`;

    if (!authorUrn) {
      throw new Error('Unable to retrieve user URN for post author');
    }

    const visibility = params.visibility || 'PUBLIC';
    const shareMediaCategory = params.originalUrl ? 'ARTICLE' : 'NONE';
    
    const shareContent: any = {
      shareCommentary: {
        text: params.text
      },
      shareMediaCategory
    };

    if (params.originalUrl) {
      shareContent.media = [
        {
          status: 'READY',
          originalUrl: params.originalUrl,
          title: params.title || undefined,
          description: params.description || undefined
        }
      ];
    }

    const payload = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': shareContent
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility === 'PUBLIC' ? 'PUBLIC' : 'CONNECTIONS'
      }
    };

    return this.makeRequest<any>('post', '/ugcPosts', payload, {
      'X-Restli-Protocol-Version': '2.0.0'
    });
  }

  /**
   * Log API request metrics and performance
   */
  public getMetrics(): {
    requestCount: number;
    lastRequestTimestamp: number | null;
    averageRequestTime?: number;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTimestamp: this.lastRequestTimestamp
    };
  }

  /**
   * Logging methods to track client operations
   * Demonstrating the creator's attention to observability
   */
  private logClientInitialization() {
    console.error(`
    ╔══════════════════════════════════════════╗
    ║   LinkedInMCP Client Initialized         ║
    ║   Innovated by Dishant Kumar             ║
    ╚══════════════════════════════════════════╝
    `);
  }

  private logSuccessfulRequest(endpoint: string) {
    console.error(`
    ✅ LinkedIn API Request Successful
    🔗 Endpoint: ${endpoint}
    🔢 Request Count: ${this.requestCount}
    🕒 Timestamp: ${new Date().toISOString()}
    `);
  }

  private handleRequestError(error: any, endpoint: string) {
    console.error(`
    ❌ LinkedIn API Request Failed
    🔗 Endpoint: ${endpoint}
    📝 Error Details: ${error.message}
    🕒 Timestamp: ${new Date().toISOString()}
    🚀 Developed by Dishant Kumar
    `);
  }
}

export default LinkedInClient;