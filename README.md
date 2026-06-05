<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">

<img src="/public/logo.png" width="30%" style="position: relative; top: 0; right: 0;" alt="Project Logo"/>

# SKILLSPRINT-FE

<em>Empowering Rapid Skill Mastery Through Seamless Learning</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/last-commit/AnhKhoaa157/SkillSprint-FE?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/AnhKhoaa157/SkillSprint-FE?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/AnhKhoaa157/SkillSprint-FE?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
<br>
<img src="https://img.shields.io/badge/Zod-3E67B1.svg?style=flat&logo=Zod&logoColor=white" alt="Zod">
<img src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white" alt="Axios">
<img src="https://img.shields.io/badge/datefns-770C56.svg?style=flat&logo=date-fns&logoColor=white" alt="datefns">
<img src="https://img.shields.io/badge/React%20Hook%20Form-EC5990.svg?style=flat&logo=React-Hook-Form&logoColor=white" alt="React%20Hook%20Form">
<img src="https://img.shields.io/badge/React%20Router-CA4245.svg?style=flat&logo=React-Router&logoColor=white" alt="React%20Router">

</div>
<br>

---

## 📄 Table of Contents

- [Overview](#-overview)
- [Getting Started](#-getting-started)
    - [Prerequisites](#-prerequisites)
    - [Installation](#-installation)
    - [Usage](#-usage)
    - [Testing](#-testing)
- [Features](#-features)
- [Project Structure](#-project-structure)
    - [Project Index](#-project-index)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## ✨ Overview

SkillSprint-FE is a modern, modular frontend framework tailored for building scalable, high-performance web applications with React, Tailwind CSS, and Vite. It offers a comprehensive setup for streamlined development, deployment, and asset management, enabling developers to focus on delivering engaging user experiences.

**Why SkillSprint-FE?**

This project simplifies the creation of responsive, feature-rich interfaces with integrated API services for payments, user profiles, learning management, and real-time notifications. The core features include:

- 🧩 **🎨 Colorful** Environment configuration with Vite, React, Tailwind CSS, and project aliases for organized code.
- 🚀 **🛠️** Modular API integrations supporting payments, user profiles, learning structures, and more.
- 🔔 **🌐** Real-time notifications and progress tracking for dynamic user engagement.
- 📊 **🖥️** Rich UI components like dashboards, roadmaps, and visualizations for an intuitive experience.
- ⚡ **🌟** Optimized build process supporting deployment via Vercel and scalable asset management.

---

## 📌 Features

|      | Component       | Details                                                                                     |
| :--- | :-------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**  | <ul><li>Next.js framework for server-side rendering and routing</li><li>Component-based React architecture</li><li>Uses React hooks extensively for state and lifecycle management</li></ul> |
| 🔩 | **Code Quality**  | <ul><li>TypeScript for static typing and better maintainability</li><li>Consistent code style with ESLint and Prettier configurations</li><li>Modular component structure with clear separation of concerns</li></ul> |
| 📄 | **Documentation** | <ul><li>README.md provides project overview and setup instructions</li><li>Inline comments and JSDoc annotations in components</li><li>Some API and component documentation via storybook or similar tools (assumed)</li></ul> |
| 🔌 | **Integrations**  | <ul><li>UI components from 'skill-sprint-ui-kit.txt'</li><li>State management with React Context and Radix UI</li><li>Routing via react-router</li><li>HTTP requests handled with axios</li><li>Real-time features via @stomp/stompjs</li><li>Form handling with react-hook-form and zod validation</li></ul> |
| 🧩 | **Modularity**    | <ul><li>Reusable React components with clear props interfaces</li><li>Custom hooks for encapsulating logic</li><li>Component composition for complex UI features</li></ul> |
| 🧪 | **Testing**       | <ul><li>Testing setup likely includes Jest and React Testing Library (assumed)</li><li>Unit tests for components and hooks</li><li>Some integration tests for workflows (assumed)</li></ul> |
| ⚡️  | **Performance**   | <ul><li>Code splitting via Next.js dynamic imports</li><li>Optimized images and assets</li><li>Use of tailwindcss for minimal CSS footprint</li></ul> |
| 🛡️ | **Security**      | <ul><li>Input validation with zod schemas</li><li>Secure handling of user data and tokens</li><li>Potential CSRF/XSS protections via Next.js and React best practices</li></ul> |
| 📦 | **Dependencies**  | <ul><li>Core dependencies: React, Next.js, TypeScript, Tailwind CSS</li><li>UI & Utility libs: Radix UI, lucide-react, @emotion, clsx, tailwind-merge</li><li>Form & validation: react-hook-form, zod</li><li>Real-time & networking: @stomp/stompjs, axios</li></ul> |

---

## 📁 Project Structure

```sh
└── SkillSprint-FE/
    ├── README.md
    ├── guidelines
    │   └── Guidelines.md
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── src
    │   ├── api
    │   ├── app
    │   ├── hooks
    │   ├── imports
    │   ├── main.tsx
    │   └── styles
    ├── vercel.json
    └── vite.config.ts
```

---

### 📑 Project Index

<details open>
	<summary><b><code>SKILLSPRINT-FE/</code></b></summary>
	<!-- __root__ Submodule -->
	<details>
		<summary><b>__root__</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ __root__</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/vite.config.ts'>vite.config.ts</a></b></td>
					<td style='padding: 8px;'>- Configure development environment by integrating React and Tailwind CSS plugins within Vite, enabling streamlined build processes and efficient asset resolution<br>- Establishes project aliases and supports raw import of specific asset types, facilitating organized code structure and optimized asset management across the application.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides an overview of the SkillSprint Web App UI, outlining its role in delivering a user interface for the SkillSprint platform<br>- It facilitates the development, deployment, and hosting of a responsive, single-page application, enabling users to interact seamlessly with the platform’s features<br>- The setup supports efficient local development and streamlined deployment via Vercel.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/postcss.config.mjs'>postcss.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Defines a minimal PostCSS configuration that leverages Tailwind CSS v4 via Vite, relying on its automatic plugin setup<br>- It provides a placeholder for adding custom PostCSS plugins if needed, ensuring flexibility within the styling pipeline while maintaining streamlined integration with Tailwind CSS.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the core configuration and dependencies for the @figma/my-make-file project, enabling development, building, and dependency management within a React and TypeScript-based design tool environment<br>- It orchestrates the setup of UI component libraries, styling frameworks, and development scripts, ensuring a cohesive architecture for building a modular, scalable, and maintainable Figma plugin or web application.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/index.html'>index.html</a></b></td>
					<td style='padding: 8px;'>- Establishes the foundational HTML structure for the SkillSprint AI learning platform, setting up the webpages metadata, visual branding, and entry point for the application<br>- It ensures proper rendering across devices and loads the main React-based application, integrating the user interface with the underlying codebase to deliver an interactive educational experience.</td>
				</tr>
			</table>
		</blockquote>
	</details>
	<!-- src Submodule -->
	<details>
		<summary><b>src</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ src</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/main.tsx'>main.tsx</a></b></td>
					<td style='padding: 8px;'>- Initialize and render the main application interface within the web page, serving as the entry point for the user-facing React application<br>- It sets up the root element, integrates the core App component, and applies global styles, thereby establishing the foundational structure for the entire frontend architecture.</td>
				</tr>
			</table>
			<!-- api Submodule -->
			<details>
				<summary><b>api</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ src.api</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/sepayPaymentService.ts'>sepayPaymentService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides functions to create and manage Sepay payment transactions, including initiating payments, retrieving payment status, and accessing user payment history<br>- Integrates with the core API client to facilitate seamless communication with the backend payment service, supporting the overall payment processing architecture within the application.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/healthService.ts'>healthService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides mechanisms to monitor and assess the applications health status by periodically querying a backend health endpoint<br>- Facilitates real-time updates for subscribers on service availability, enabling proactive handling of service disruptions and ensuring system reliability within the overall architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/apiClient.ts'>apiClient.ts</a></b></td>
							<td style='padding: 8px;'>- Provides a centralized API client for seamless communication with the backend service, managing request headers, authentication tokens, and session data<br>- Facilitates robust, consistent HTTP requests with built-in error handling and debugging support, ensuring secure and efficient data exchange within the applications architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/tutorService.ts'>tutorService.ts</a></b></td>
							<td style='padding: 8px;'>- Facilitates interaction with the tutoring API by enabling users to ask questions related to specific workspaces or roadmap steps<br>- It provides structured responses, including answers, suggested follow-up questions, confidence levels, and contextual information about the current workspace or step, thereby supporting intelligent guidance within the overall project architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/materialService.ts'>materialService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core functionalities for managing material uploads and processing within workspaces, including generating upload URLs, confirming uploads, retrieving material lists, monitoring processing jobs, and deleting materials<br>- Facilitates seamless integration with storage and processing workflows, ensuring efficient handling of user-uploaded content and its lifecycle in the applications architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/authService.ts'>authService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core authentication services, managing user login, registration, password recovery, and session handling within the application architecture<br>- Facilitates secure token exchange, role extraction, and user profile retrieval, supporting seamless user identity management and access control across the platform<br>- Ensures persistent session storage and interaction with backend authentication APIs to maintain user authentication state.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/dateService.ts'>dateService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides utility functions for retrieving and formatting current date information, supporting date-related operations within the application<br>- Facilitates obtaining server-based date data, including start and end of the current month, and formats dates for display in Vietnamese locale or ISO standard<br>- Enhances date consistency and flexibility across the codebase, serving as a foundational component for date management.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/quizService.ts'>quizService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core functionalities for managing quizzes within the application, including retrieving current quizzes, generating new AI-driven quizzes for specific roadmap steps, submitting answers for scoring, and fetching the latest attempt details<br>- These services facilitate seamless quiz interactions, supporting user assessment and progress tracking within the broader learning architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/calendarService.ts'>calendarService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core functionalities for managing and scheduling calendar tasks within the application<br>- Facilitates generating personalized study schedules, retrieving and updating tasks, and integrating Eisenhower matrix prioritization<br>- Serves as a central API layer that orchestrates calendar and task operations, ensuring seamless task management and scheduling workflows across user workspaces.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/meService.ts'>meService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides user profile management functionalities, enabling retrieval and updates of personal information, including full name and avatar<br>- Facilitates secure avatar uploads via pre-signed S3 URLs, ensuring seamless and efficient profile image updates<br>- Integrates with backend API endpoints to maintain consistent user data and support a personalized user experience within the overall application architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/notificationsService.ts'>notificationsService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core notification management functionalities within the application, enabling retrieval of all or unread notifications, marking notifications as read, and creating reminders tied to specific workspaces<br>- These functions facilitate seamless user engagement and task tracking, integrating with the broader API architecture to support real-time updates and user notifications across the platform.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/progressService.ts'>progressService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides functions to retrieve progress tracking data for workspaces, including overall roadmap status, task completion metrics, current steps, and upcoming activities<br>- Integrates with the API client to fetch real-time progress insights, supporting the broader architectures goal of visualizing and managing project advancement within user workspaces.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/skillSprintApiClient.ts'>skillSprintApiClient.ts</a></b></td>
							<td style='padding: 8px;'>- Provides a centralized API client for interacting with the skill sprint backend, managing request configuration, authentication headers, and response handling<br>- Facilitates seamless communication between the frontend and backend services, ensuring consistent data extraction, error handling, and session management within the applications architecture<br>- Enhances maintainability and robustness of API integrations across the codebase.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/subscriptionsService.ts'>subscriptionsService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core functionalities for managing user subscriptions within the application<br>- Facilitates retrieval of current subscription details and quota status, enabling the system to monitor user entitlements<br>- Also supports subscription cancellation, ensuring users can effectively control their subscription lifecycle<br>- These functions integrate with the API layer to maintain up-to-date subscription data across the platform.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/learningStructureService.ts'>learningStructureService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core functionalities for managing learning structures within a workspace, including generating, retrieving, confirming, and modifying chapters and topics<br>- Facilitates seamless interaction with the backend API to support dynamic content organization, enabling users to create, update, and delete learning components, thereby ensuring flexible and structured educational content management across the platform.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/onboardingService.ts'>onboardingService.ts</a></b></td>
							<td style='padding: 8px;'>- Defines API interactions for managing user onboarding profiles within workspaces, enabling retrieval and creation or updates of onboarding data<br>- Facilitates seamless onboarding experiences by handling profile data such as goals, study hours, deadlines, and preferences, integrating with backend services to ensure user-specific onboarding information is accurately stored and accessed within the overall application architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/workspaceService.ts'>workspaceService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core functionalities for managing workspaces within the application, including creating, retrieving, updating, and deleting workspace entities<br>- Facilitates seamless interaction with backend APIs to maintain workspace data, supporting users in organizing and maintaining their project environments efficiently within the overall system architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/adminDashboardService.ts'>adminDashboardService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides functions to retrieve comprehensive administrative dashboard analytics and payment transaction data, supporting monitoring of user engagement, subscription metrics, revenue, and system alerts<br>- Facilitates data-driven decision-making by aggregating key performance indicators and recent activity insights within the overall application architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/skillSprintModels.ts'>skillSprintModels.ts</a></b></td>
							<td style='padding: 8px;'>- Defines data types and interfaces for managing user reminders, notifications, subscription plans, quotas, and payment transactions within the skill sprint platform<br>- Facilitates structured communication between frontend and backend components, supporting features like scheduling alerts, tracking user activity, handling subscription details, and processing payments, thereby ensuring seamless user engagement and service management across the application architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/roadmapService.ts'>roadmapService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core functionalities for managing learning roadmaps within the application<br>- Enables generating personalized roadmaps based on user goals, retrieving current roadmaps, and updating individual steps or overall roadmap status<br>- Facilitates seamless interaction with backend APIs to support dynamic, goal-oriented learning plans aligned with user progress and preferences.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/adminUserService.ts'>adminUserService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides an API interface for managing administrative user data, including fetching user lists, retrieving detailed user profiles, and updating user statuses and roles<br>- Facilitates seamless communication between the frontend and backend services, ensuring consistent data normalization and handling authentication headers, thereby supporting administrative functions within the overall application architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/api/studySessionService.ts'>studySessionService.ts</a></b></td>
							<td style='padding: 8px;'>- Provides core API functions for managing study sessions, including starting, pausing, resuming, progressing through Pomodoro phases, and completing sessions<br>- Facilitates seamless integration of study workflows within the application by abstracting backend interactions for session lifecycle, task association, and resource retrieval, supporting both calendar-based and roadmap-based study activities.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- hooks Submodule -->
			<details>
				<summary><b>hooks</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ src.hooks</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/hooks/useSubscription.ts'>useSubscription.ts</a></b></td>
							<td style='padding: 8px;'>- Provides a hook to manage and display current user subscription status within the application<br>- It fetches real-time subscription data, normalizes plan types, and supplies relevant metadata for UI representation<br>- This component ensures seamless integration of subscription state, enabling dynamic feature access and upgrade prompts aligned with the overall architecture.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- imports Submodule -->
			<details>
				<summary><b>imports</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ src.imports</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/syllabus-input.md'>syllabus-input.md</a></b></td>
							<td style='padding: 8px;'>- Provides the user interface for inputting course syllabi, enabling AI-driven analysis of course structure, skill gaps, and learning roadmaps<br>- Facilitates seamless text pasting or file uploads within a centered content area, complemented by navigation and informational prompts<br>- Serves as a foundational component for transforming raw syllabus data into personalized study plans within the broader AI learning platform architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/onboarding-flow.md'>onboarding-flow.md</a></b></td>
							<td style='padding: 8px;'>- Defines the user onboarding experience for SkillSprint, guiding new users through profile calibration, goal setting, and personalized analysis<br>- It establishes a sleek, high-end aesthetic aligned with the app’s minimalist dark mode style, creating an engaging, gamified introduction that seamlessly transitions users into their tailored learning journey<br>- This flow ensures a smooth, visually compelling onboarding aligned with the platform’s premium design ethos.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/skill-sprint-ui-kit.txt'>skill-sprint-ui-kit.txt</a></b></td>
							<td style='padding: 8px;'>- Defines the user experience flow for SkillSprints paywall and feature lock system, guiding Free Tier users toward premium upgrades through visually engaging locked states and streamlined checkout modals<br>- Supports the overall architecture by managing access control, monetization pathways, and user engagement, ensuring a cohesive and premium onboarding experience aligned with the platform’s high-end, data-driven design aesthetic.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/dashboard-pomodoro-1.tsx'>dashboard-pomodoro-1.tsx</a></b></td>
							<td style='padding: 8px;'>- Defines the main dashboard interface for SkillSprint, integrating task management, a Pomodoro timer, and navigation elements<br>- It serves as the central hub for students to organize daily activities, focus sessions, and access key features, embodying the app’s minimalist, productivity-focused architecture with a clean, user-friendly layout inspired by Notion and TickTick.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/ui-ux-changes-and-prompts.md'>ui-ux-changes-and-prompts.md</a></b></td>
							<td style='padding: 8px;'>- Defines UI/UX design prompts for key platform features, including admin portals, payment workflows, user dashboards, and marketing pages<br>- Facilitates seamless user onboarding, subscription management, and feature presentation, aligning visual and interaction design with project architecture to enhance user experience, security, and operational efficiency across SkillSprint’s ecosystem.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/ai-study-planner.md'>ai-study-planner.md</a></b></td>
							<td style='padding: 8px;'>- Provides an overview of the AI-driven study planning system, emphasizing its role in transforming syllabus data into personalized learning roadmaps<br>- It highlights how the system analyzes knowledge gaps, creates tailored schedules, and dynamically adjusts plans based on real-time progress, supporting students in efficiently preparing for exams through automated scheduling, progress tracking, and behavioral reminders.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/skill-sprint-auth-flow.md'>skill-sprint-auth-flow.md</a></b></td>
							<td style='padding: 8px;'>- Defines the user authentication flow and interface for SkillSprint, encompassing login, registration, and password reset screens<br>- It ensures a sleek, high-end aesthetic aligned with linear.app and Vercel, facilitating seamless user onboarding and account management within the app’s architecture<br>- This component enhances user access control, maintaining visual consistency across the platform’s authentication experience.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/dashboard-pomodoro.txt'>dashboard-pomodoro.txt</a></b></td>
							<td style='padding: 8px;'>- Defines the main dashboard interface for SkillSprint, emphasizing a minimalist, user-friendly layout that integrates task management with a prominent Pomodoro timer<br>- It serves as the central hub for students to organize daily tasks and focus sessions, aligning with the app’s goal of enhancing productivity through clean design and intuitive interaction.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/dashboard-pomodoro.tsx'>dashboard-pomodoro.tsx</a></b></td>
							<td style='padding: 8px;'>- Defines the main dashboard interface for SkillSprint, integrating task management and a Pomodoro timer to enhance student productivity<br>- It provides a clean, minimalist layout focused on time tracking and task overview, serving as the central hub within the apps architecture to support focused study sessions and task organization.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/imports/evidence-portfolio-export.md'>evidence-portfolio-export.md</a></b></td>
							<td style='padding: 8px;'>- Defines the user interface for SkillSprints Evidence Portfolio & Export page, enabling users to visualize verified skills through dynamic data visualizations and access a premium export feature for creating verifiable competency profiles<br>- It integrates sleek, high-end design elements aligned with the platform’s focus on showcasing learning achievements and facilitating professional opportunities within a cohesive, visually engaging layout.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- app Submodule -->
			<details>
				<summary><b>app</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ src.app</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/App.tsx'>App.tsx</a></b></td>
							<td style='padding: 8px;'>- Establishes the core application structure by integrating routing, global authentication context, and user notifications<br>- Facilitates seamless navigation and user session management across the app, ensuring consistent access control and real-time feedback<br>- Serves as the foundational entry point that orchestrates essential providers, enabling a cohesive and responsive user experience within the overall architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/routes.ts'>routes.ts</a></b></td>
							<td style='padding: 8px;'>- Defines the applications client-side routing architecture, organizing navigation paths across public, admin, and authenticated user sections<br>- It maps URL structures to corresponding React components, ensuring seamless access control, layout consistency, and user flow management within the overall project framework.</td>
						</tr>
					</table>
					<!-- pages Submodule -->
					<details>
						<summary><b>pages</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.pages</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/Pricing.tsx'>Pricing.tsx</a></b></td>
									<td style='padding: 8px;'>- The <code>Pricing.tsx</code> file defines the main user interface for the applications pricing page<br>- It orchestrates the presentation of different pricing options, allowing users to toggle between annual and monthly plans, and provides an interactive FAQ section<br>- Within the overall architecture, this component serves as the entry point for users to explore subscription tiers, facilitating informed decision-making<br>- It integrates visual elements like animated transitions and custom cursor effects to enhance user engagement, aligning with the applications focus on a polished, user-centric experience.</td>
								</tr>
							</table>
							<!-- admin Submodule -->
							<details>
								<summary><b>admin</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.pages.admin</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/admin/AdminUserDetail.tsx'>AdminUserDetail.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides an administrative interface for viewing and managing user details within the application<br>- Enables updating user status and roles through API interactions, facilitating user management tasks<br>- Integrates seamlessly into the overall admin dashboard, supporting efficient user oversight and role assignment workflows.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/admin/AdminDashboard.tsx'>AdminDashboard.tsx</a></b></td>
											<td style='padding: 8px;'>- AdminDashboard.tsxThis file defines the core administrative dashboard page within the applications architecture<br>- Its primary purpose is to aggregate and display key metrics, analytics, and health indicators relevant to system administrators<br>- By integrating various visual components such as charts, icons, and health status panels, it provides a comprehensive overview of system performance, user activity, and financial transactions<br>- This facilitates informed decision-making and efficient management of the platform's operational health.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/admin/AdminHealth.tsx'>AdminHealth.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides an administrative dashboard for monitoring system health status, displaying real-time status updates, historical health checks, and quick statistics<br>- Facilitates manual health probing and visualizes system stability, enabling quick identification of issues and overall system reliability within the applications architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/admin/AdminUsers.tsx'>AdminUsers.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides an administrative interface for managing user accounts, enabling search, pagination, and detailed viewing of user information<br>- Facilitates efficient oversight of user data within the broader application architecture, supporting user management workflows and ensuring seamless navigation between user summaries and detailed profiles.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/admin/AdminProfile.tsx'>AdminProfile.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides an administrative profile interface for viewing and updating user details, including full name and profile picture, while displaying system metadata such as User ID, roles, and account status<br>- Facilitates seamless profile management, handles authentication states, and ensures real-time updates, integrating with backend services to maintain data consistency within the overall application architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/admin/AdminAuth.tsx'>AdminAuth.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>AdminAuth.tsx</code> file serves as the core authentication interface for the admin section of the application<br>- It manages user login, password reset workflows, and verification processes, ensuring secure access control for administrative users<br>- Within the overall architecture, this component facilitates authentication-related interactions, integrating with backend services to validate credentials, handle password policies, and navigate users appropriately<br>- Its role is pivotal in maintaining the security and integrity of the admin portal, providing a seamless and secure authentication experience aligned with the systems security standards.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- learning Submodule -->
							<details>
								<summary><b>learning</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.pages.learning</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/learning/CoursePlayer.tsx'>CoursePlayer.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>CoursePlayer.tsx</code> file serves as the central component for delivering an interactive learning experience within the application<br>- It orchestrates the presentation and management of course content, including lessons, quizzes, and study sessions<br>- By integrating various APIs and context providers, it enables users to engage with educational materials, track their progress, and participate in timed study activities like Pomodoro sessions<br>- Overall, this component acts as the primary interface for users to consume course content, monitor their learning journey, and interact with supplementary features that enhance engagement and retention across the platform.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/learning/QuizReviewFlow.tsx'>QuizReviewFlow.tsx</a></b></td>
											<td style='padding: 8px;'>- Facilitates an interactive quiz review experience within the learning platform, enabling users to answer questions, track remaining time, and view progress<br>- It manages quiz state, calculates scores, and navigates to results upon completion, integrating seamlessly into the broader course architecture to enhance learner engagement and assessment feedback.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/learning/QuizPage.tsx'>QuizPage.tsx</a></b></td>
											<td style='padding: 8px;'>- Facilitates user interaction with quizzes by rendering the quiz interface within the application<br>- Manages quiz loading based on navigation state, ensuring proper context is provided, and handles quiz completion to navigate users appropriately<br>- Integrates subscription plan data to tailor the quiz experience, supporting seamless progression within the learning platforms architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/learning/SyllabusInput.tsx'>SyllabusInput.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>SyllabusInput.tsx</code> file serves as a core component within the learning module of the application, primarily responsible for facilitating user input related to course syllabi or assessment schedules<br>- It provides an interactive interface that allows users to input, visualize, and manage learning content such as quizzes, exams, and deadlines<br>- By integrating visual elements and user-friendly controls, this component helps structure and organize educational data, supporting the broader architectures goal of delivering a seamless and intuitive learning experience<br>- It acts as a pivotal point for capturing and displaying curriculum-related information, ensuring that the learning flow remains coherent and accessible within the overall application framework.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/learning/StudyCalendar.tsx'>StudyCalendar.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>src/app/pages/learning/StudyCalendar.tsx</code> file serves as the core component for displaying and managing the users learning schedule within the application<br>- It orchestrates the rendering of an interactive calendar view, allowing users to visualize their upcoming learning tasks, appointments, and AI-suggested schedules<br>- By integrating data from various services and hooks, it provides a dynamic and personalized overview of the users learning roadmap, facilitating efficient planning and engagement with scheduled activities<br>- This component is pivotal in connecting user profile data, calendar tasks, and AI-driven scheduling suggestions, thereby supporting the overall architecture's goal of delivering a tailored, seamless learning experience.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/learning/QuizResult.tsx'>QuizResult.tsx</a></b></td>
											<td style='padding: 8px;'>- Displays quiz results and progression options within the learning platform, summarizing user performance and guiding next steps<br>- It provides feedback on quiz completion, score, and correct answers, while offering navigation to review the quiz, revisit the lesson, or proceed to the next module<br>- Enhances user engagement and seamless learning flow across the course architecture.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- deprecated Submodule -->
							<details>
								<summary><b>deprecated</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.pages.deprecated</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/deprecated/WorkspacesNew.tsx'>WorkspacesNew.tsx</a></b></td>
											<td style='padding: 8px;'>- Facilitates the creation of new workspaces within the application by capturing user input for workspace name and description, storing the data locally, and navigating back to the workspaces overview<br>- This component integrates into the broader project architecture by enabling users to organize and manage distinct work environments, supporting the applications focus on workspace-based workflows and user customization.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- workspace Submodule -->
							<details>
								<summary><b>workspace</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.pages.workspace</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/workspace/Roadmap.tsx'>Roadmap.tsx</a></b></td>
											<td style='padding: 8px;'>- Roadmap.tsxThis component serves as the central interface for displaying and managing a users learning roadmap within the application<br>- It orchestrates the retrieval and presentation of structured educational content, including steps, resources, and progress tracking<br>- By integrating data from the roadmap and calendar services, it provides a comprehensive view of the user's learning journey, enabling navigation through different stages and facilitating interactions such as viewing resources or engaging with AI-powered tutoring<br>- Overall, it plays a pivotal role in delivering a personalized, interactive learning experience aligned with the application's architecture for structured educational workflows.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/workspace/WorkspaceDetail.tsx'>WorkspaceDetail.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>WorkspaceDetail.tsx</code> file serves as the central page component for displaying detailed information and interactions within a specific workspace<br>- It orchestrates various subcomponents and modals—such as workspace configuration editing, onboarding guidance, and learning structure visualization—to facilitate a comprehensive and interactive user experience<br>- This file integrates user session management, navigation, and progress tracking, thereby enabling users to effectively manage, customize, and engage with their workspace content<br>- Overall, it acts as the primary interface for workspace exploration and configuration within the applications architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/workspace/Dashboard.tsx'>Dashboard.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>Dashboard.tsx</code> file serves as the central hub for the applications workspace, providing users with an interactive overview of key features and modules<br>- It orchestrates the display of various showcase modules—such as AI roadmaps, task matrices, and schedules—highlighting their purpose and access tiers<br>- By integrating visual elements and navigation, this component facilitates seamless user engagement, guiding users through available tools and resources within the broader application architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/workspace/Workspaces.tsx'>Workspaces.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>Workspaces.tsx</code> file serves as the central page component for managing and displaying user workspaces within the application<br>- Its primary purpose is to fetch, render, and facilitate interactions with a list of workspaces, providing users with an overview and access to their workspace resources<br>- This component integrates with backend services to retrieve workspace data, manages UI states such as loading and error conditions, and presents individual workspaces through dedicated <code>WorkspaceCard</code> components<br>- Overall, it acts as the main interface for users to view, navigate, and potentially create or modify their workspaces, forming a key part of the applications workspace management architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/workspace/TaskMatrix.tsx'>TaskMatrix.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>TaskMatrix.tsx</code> file serves as the core component for managing and visualizing tasks within a workspace, structured around the Eisenhower matrix methodology<br>- It enables users to view, create, and update tasks categorized into four quadrants—such as immediate action, scheduling, delegation, or elimination—facilitating prioritized task management<br>- This component integrates with backend services to fetch workspace data and synchronize task states, supporting an organized and efficient workflow within the applications broader architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/workspace/AiTutorChat.tsx'>AiTutorChat.tsx</a></b></td>
											<td style='padding: 8px;'>- Facilitates real-time AI-driven chat interactions within the workspace or specific steps, enabling users to pose questions and receive contextualized responses<br>- Manages message flow, user input, and AI responses, enhancing user engagement with intelligent guidance<br>- Supports dynamic suggestions and confidence indicators, integrating seamlessly into the broader architecture to improve learning and decision-making workflows.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/workspace/WorkspaceRoadmap.tsx'>WorkspaceRoadmap.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a streamlined entry point for the workspace roadmap feature by re-exporting the main Roadmap component<br>- It integrates the roadmap view into the broader application architecture, enabling users to access and visualize project milestones and planning within the workspace context seamlessly<br>- This file acts as a connector, ensuring modularity and maintainability of the roadmap functionality within the project.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- auth Submodule -->
							<details>
								<summary><b>auth</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.pages.auth</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/auth/Auth.tsx'>Auth.tsx</a></b></td>
											<td style='padding: 8px;'>- This file, <code>src/app/pages/auth/Auth.tsx</code>, serves as the central authentication interface within the applications architecture<br>- It orchestrates user authentication workflows such as login, registration, password recovery, and account confirmation, providing a cohesive user experience for onboarding and access control<br>- By integrating various authentication-related processes and modals, it ensures secure and streamlined user interactions, acting as a gateway that manages user identity verification and session initiation in alignment with the overall application structure.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- components Submodule -->
							<details>
								<summary><b>components</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.pages.components</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/components/BrandLogo.tsx'>BrandLogo.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a centralized export point for the BrandLogo component, facilitating streamlined imports across the application<br>- It enhances modularity and maintainability by consolidating component references, supporting consistent branding implementation throughout the project’s user interface<br>- This file plays a key role in organizing component dependencies within the overall architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/components/PublicNavbar.tsx'>PublicNavbar.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a centralized export of the PublicNavbar component, facilitating streamlined imports across the application<br>- It enhances modularity and maintainability by consolidating access to the public navigation bar, which is a key element in the user interface for unauthenticated or public-facing pages within the overall project architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/components/Footer.tsx'>Footer.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a centralized export of the Footer component, facilitating streamlined imports across the application<br>- It enhances maintainability by consolidating the Footers location, ensuring consistent usage throughout the project<br>- This setup supports a modular architecture, enabling easier updates and promoting code organization within the overall codebase.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/components/CursorSpotlight.tsx'>CursorSpotlight.tsx</a></b></td>
											<td style='padding: 8px;'>- Facilitates the integration of the CursorSpotlight component into the applications page structure, enabling interactive cursor-based highlighting features<br>- Serves as a centralized export point within the page-specific directory, streamlining component imports and maintaining modular architecture across the codebase<br>- Enhances user experience by providing dynamic visual cues aligned with page content.</td>
										</tr>
									</table>
									<!-- landing Submodule -->
									<details>
										<summary><b>landing</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ src.app.pages.components.landing</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/components/landing/LandingHero3DViewer.tsx'>LandingHero3DViewer.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a streamlined entry point for the 3D viewer component on the landing page, enabling seamless integration of interactive 3D visuals into the user interface<br>- It serves as a connector within the overall architecture, facilitating the display of engaging, immersive content that enhances the landing experience and supports the projects goal of showcasing 3D assets effectively.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/components/landing/LandingSection3DViewer.tsx'>LandingSection3DViewer.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a streamlined entry point for the 3D viewer component within the landing page, integrating the 3D visualization feature into the overall user interface<br>- It facilitates seamless rendering of interactive 3D content, enhancing the landing experience and supporting the projects goal of engaging users with immersive visual elements.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- core Submodule -->
							<details>
								<summary><b>core</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.pages.core</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/core/Leaderboard.tsx'>Leaderboard.tsx</a></b></td>
											<td style='padding: 8px;'>- Implements a dynamic leaderboard interface that displays user rankings, progress, and achievements within the application<br>- It enables users to view their current standing, compare with peers across different timeframes, and access motivational tips, fostering engagement and competition in the overall learning platform architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/core/Loading.tsx'>Loading.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a loading interface that visually indicates transition progress while navigating users to the main workspace area<br>- It ensures a smooth user experience by displaying branding, status messages, and animated progress indicators during page load, serving as an intermediary step within the applications routing flow.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/core/Profile.tsx'>Profile.tsx</a></b></td>
											<td style='padding: 8px;'>- SummaryThe <code>src/app/pages/core/Profile.tsx</code> file serves as the central component for managing and displaying the users profile within the application<br>- It orchestrates user-related functionalities such as viewing profile details, handling subscription status, and managing payments<br>- By integrating various API services, it enables users to review their account information, monitor subscription quotas, initiate cancellations, and process payments seamlessly<br>- Overall, this file plays a pivotal role in providing a personalized and interactive user experience, aligning with the application's architecture focused on user account management and service subscriptions.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/pages/core/PostUpgrade.tsx'>PostUpgrade.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a user interface for post-upgrade engagement, highlighting activated tiers and their benefits<br>- Facilitates seamless navigation to learning resources, skill tools, and profile management, while dynamically adjusting content based on the users selected tier<br>- Enhances user experience by visually confirming successful upgrades and encouraging further exploration of premium features.</td>
										</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
					<!-- hooks Submodule -->
					<details>
						<summary><b>hooks</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.hooks</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/hooks/useNotificationSocket.ts'>useNotificationSocket.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates real-time user notifications through WebSocket integration, managing connection lifecycle, message handling, and notification state updates<br>- Loads notification history on mount, displays alerts with contextual icons, and provides functionality to mark notifications as read<br>- Enhances user engagement by ensuring timely, synchronized alerts within the applications overall architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/hooks/useOnboardingProfile.ts'>useOnboardingProfile.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a React hook to manage onboarding profile data within the application, enabling fetching and updating user onboarding information tied to a specific workspace<br>- Facilitates seamless integration of onboarding workflows by abstracting API interactions, state management, and error handling, thereby supporting a smooth onboarding experience and maintaining consistent profile data across the codebase.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/hooks/useRoadmap.ts'>useRoadmap.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a React hook for managing project roadmaps within a workspace, enabling fetching, generating, and error handling of roadmap data<br>- Integrates with backend APIs to retrieve current roadmap status and trigger new roadmap generation, supporting dynamic updates and user interaction in the applications architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/hooks/useCurrentDate.ts'>useCurrentDate.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a React hook to fetch and synchronize the current date from the server, ensuring the applications date-dependent features remain accurate<br>- It manages loading and error states, automatically updates the date every minute, and exposes date components for seamless integration within the broader application architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- config Submodule -->
					<details>
						<summary><b>config</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.config</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/config/nav.ts'>nav.ts</a></b></td>
									<td style='padding: 8px;'>- Defines the applications navigation structure by specifying menu sections, items, icons, and routing details<br>- Facilitates consistent and organized user interface navigation across different user roles, such as administrators and general users, supporting seamless access to key features like learning pathways, performance management, and system dashboards within the overall architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- layouts Submodule -->
					<details>
						<summary><b>layouts</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.layouts</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/layouts/AdminLayout.tsx'>AdminLayout.tsx</a></b></td>
									<td style='padding: 8px;'>- Defines the layout structure for the admin interface, ensuring consistent visual presentation and user experience across admin pages<br>- Incorporates a main content outlet for nested routes and integrates a session management modal to handle user session timeouts, thereby supporting secure and seamless administrative workflows within the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/layouts/RootLayout.tsx'>RootLayout.tsx</a></b></td>
									<td style='padding: 8px;'>- Establishes a root layout that encapsulates the entire route hierarchy, ensuring the PomodoroContext provider is integrated at the highest level<br>- This setup enables global state management for Pomodoro timer functionality across the application, facilitating consistent behavior and state sharing throughout the user interface.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/layouts/DashboardLayout.tsx'>DashboardLayout.tsx</a></b></td>
									<td style='padding: 8px;'>- DashboardLayout.tsxThis file defines the primary layout component for the applications dashboard, orchestrating the overall user interface structure<br>- It manages the rendering of navigation elements, modals, and dynamic content areas, ensuring a cohesive and responsive user experience<br>- By integrating user profile data, workspace context, and real-time notifications, it facilitates personalized and interactive interactions within the dashboard<br>- This layout serves as the backbone for the authenticated user interface, aligning various UI components and state management to support the application's core functionalities and navigation flow.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- components Submodule -->
					<details>
						<summary><b>components</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.components</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/BrandLogo.tsx'>BrandLogo.tsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates seamless import of the BrandLogo component across the project by re-exporting it from its original location<br>- Ensures backward compatibility for existing import paths, supporting consistent branding representation within the applications user interface<br>- Integrates into the overall architecture to promote modularity and maintainability of visual branding elements.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/PublicNavbar.tsx'>PublicNavbar.tsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates seamless access to the PublicNavbar component across the project by re-exporting it from the layout directory, ensuring backward compatibility for existing imports<br>- Integrates the PublicNavbar into the overall architecture by providing a centralized entry point, enabling consistent navigation UI across public-facing pages while maintaining flexible import paths.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/Footer.tsx'>Footer.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a backward-compatible re-export of the Footer component from the layout directory, ensuring seamless imports across different parts of the application<br>- This setup maintains legacy import paths while centralizing the Footer implementation in the layout folder, supporting consistent UI structure and easing future updates within the overall project architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/Interactive3DPanel.tsx'>Interactive3DPanel.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive 3D hover effect for UI components by dynamically tilting and scaling content based on cursor position<br>- Enhances visual engagement and depth perception within the applications interface, contributing to a more immersive user experience<br>- Serves as a reusable visual component integrated into the overall architecture to elevate aesthetic appeal and interactivity.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/CursorSpotlight.tsx'>CursorSpotlight.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive cursor-driven spotlight effect that highlights underlying content with a customizable radial gradient<br>- Enhances user engagement by dynamically following cursor movements, creating a visually appealing focus area<br>- Integrates seamlessly within the applications component architecture to add immersive visual feedback without affecting underlying layout or functionality.</td>
								</tr>
							</table>
							<!-- landing Submodule -->
							<details>
								<summary><b>landing</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.components.landing</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/landing/LandingHero3DViewer.tsx'>LandingHero3DViewer.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a visually engaging fallback component for the landing page, simulating a 3D hero section with dynamic radial gradients<br>- It ensures a compelling visual experience during loading or when 3D content is unavailable, maintaining aesthetic consistency within the overall landing page architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/landing/LandingSection3DViewer.tsx'>LandingSection3DViewer.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a styled visual placeholder for the landing pages 3D section, dynamically rendering background gradients based on the selected variant<br>- It ensures a consistent aesthetic experience across different landing page sections by offering visually distinct backgrounds that enhance user engagement and thematic clarity within the overall site architecture.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- workspace Submodule -->
							<details>
								<summary><b>workspace</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.components.workspace</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/workspace/WorkspaceCard.tsx'>WorkspaceCard.tsx</a></b></td>
											<td style='padding: 8px;'>- Render a comprehensive, interactive card component representing a workspace within the application<br>- It displays key details such as title, description, creation date, progress, and resource counts, while enabling user actions like opening, editing, or deleting the workspace<br>- Additionally, it fetches and visualizes real-time progress and material data, supporting efficient workspace management and navigation in the overall architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/workspace/LearningStructureDisplay.tsx'>LearningStructureDisplay.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides an interactive, hierarchical visualization of a learning curriculum by displaying chapters, their summaries, key concepts, and associated topics<br>- Facilitates user navigation through expandable sections, enhancing comprehension of the overall structure and detailed content of the educational material within the broader application architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/workspace/WorkspaceProgress.tsx'>WorkspaceProgress.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>WorkspaceProgress.tsx</code> component serves as a central visual and data-fetching element within the applications workspace interface<br>- Its primary purpose is to present real-time progress updates, status indicators, and actionable insights related to a specific workspace<br>- By integrating data from workspace and progress services, it offers users a comprehensive overview of ongoing tasks, milestones, and overall project health, thereby facilitating informed decision-making and streamlined project management within the broader application architecture.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- auth Submodule -->
							<details>
								<summary><b>auth</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.components.auth</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/auth/SessionKickoutModal.tsx'>SessionKickoutModal.tsx</a></b></td>
											<td style='padding: 8px;'>- Implements a modal component that alerts users when their session has expired due to login from another device or browser<br>- It facilitates a seamless re-authentication process by providing a clear interface for users to log back in, ensuring security and session integrity within the applications overall authentication architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/auth/RequireAuth.tsx'>RequireAuth.tsx</a></b></td>
											<td style='padding: 8px;'>- Enforces authentication requirements across protected routes within the application, ensuring only authenticated users can access specific components<br>- It integrates with the authentication context to verify user status and redirects unauthenticated users to the login page, maintaining secure access control as part of the overall routing architecture.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- layout Submodule -->
							<details>
								<summary><b>layout</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.components.layout</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/layout/BrandLogo.tsx'>BrandLogo.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a flexible React component for displaying the SkillSprint brand logo, supporting customizable sizes, alignment, and optional accompanying text<br>- It enhances the visual branding consistency across the application by enabling easy integration of the logo with adjustable styling options, ensuring a cohesive and adaptable user interface within the overall layout architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/layout/PublicNavbar.tsx'>PublicNavbar.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>PublicNavbar.tsx</code> component serves as the primary navigation bar for the public-facing sections of the application<br>- Its main purpose is to provide users with an intuitive and responsive menu to navigate key pages such as About, Features, Pricing, and Contact<br>- The component dynamically highlights the active link based on the current route, enhances user experience with visual indicators like hover effects and a sliding pill, and adapts its layout for different screen sizes with a collapsible menu<br>- Overall, it plays a crucial role in guiding users through the website, ensuring seamless navigation within the applications architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/layout/Footer.tsx'>Footer.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides the footer component for the web application, delivering essential navigational links, company branding, subscription form, and contact information<br>- It enhances user experience by offering quick access to key resources, company details, and social media, while reinforcing brand identity and ensuring consistent footer presentation across the platform.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- modals Submodule -->
							<details>
								<summary><b>modals</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.components.modals</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/modals/ReferralModal.tsx'>ReferralModal.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>ReferralModal.tsx</code> file defines a modal component within the applications user interface, specifically designed to facilitate user referrals<br>- It orchestrates the presentation and interaction logic for sharing referral links, including visual elements like animated icons and feedback indicators<br>- This component plays a crucial role in the overall architecture by enabling seamless user engagement and incentivization through referral programs, thereby supporting user growth and community expansion within the platform.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/modals/EditWorkspaceConfigModal.tsx'>EditWorkspaceConfigModal.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>src/app/components/modals/EditWorkspaceConfigModal.tsx</code> file provides a user interface for editing workspace configuration settings within the application<br>- It enables users to modify key workspace parameters, such as scheduling preferences and confidence levels, through an interactive modal dialog<br>- This component plays a crucial role in the overall architecture by facilitating user customization and configuration management, ensuring that workspace settings are adaptable to individual or team needs<br>- It integrates with onboarding services to fetch or update relevant data, contributing to a seamless and personalized user experience across the platform.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/modals/AIScheduleModal.tsx'>AIScheduleModal.tsx</a></b></td>
											<td style='padding: 8px;'>- AIScheduleModal.tsxThis component serves as an interactive modal for scheduling AI-driven activities within the application<br>- It orchestrates a multi-step process that guides users through selecting date ranges, available days, time slots, durations, and setting goals, culminating in a preview and confirmation stage<br>- By managing user inputs and visualizing scheduling options, it enables seamless creation and customization of AI schedules, integrating tightly with the overall architecture to facilitate dynamic, user-friendly scheduling workflows.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/modals/OnboardingModal.tsx'>OnboardingModal.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>OnboardingModal.tsx</code> component serves as a user onboarding interface within the application, guiding new users through initial setup and profile configuration<br>- It encapsulates a multi-step modal form that collects user preferences, availability, and confidence levels, facilitating a personalized onboarding experience<br>- By integrating with backend services, it fetches existing onboarding data and updates user profiles accordingly<br>- This component plays a crucial role in the overall architecture by ensuring a smooth onboarding flow, enabling tailored user engagement, and setting the foundation for subsequent personalized features across the platform.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/modals/PricingModal.tsx'>PricingModal.tsx</a></b></td>
											<td style='padding: 8px;'>- PricingModal ComponentThe <code>PricingModal.tsx</code> component serves as an interactive user interface element that facilitates the selection and purchase of subscription plans within the application<br>- It presents users with various plan options, displays relevant details such as pricing and features, and manages the payment process through integration with the Sepay payment service<br>- This component is central to the user onboarding and subscription management flow, enabling seamless plan upgrades, downgrades, or new subscriptions directly from the modal interface<br>- It contributes to the overall architecture by encapsulating the user interaction for plan selection and payment, ensuring a cohesive and streamlined user experience across the applications monetization features.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/modals/RegistrationSuccessModal.tsx'>RegistrationSuccessModal.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a modal component that confirms successful user registration, guiding users to personalize their learning experience<br>- It features animated visual cues, accessible keyboard interactions, and clear call-to-action buttons, seamlessly integrating into the applications onboarding flow to enhance user engagement and onboarding efficiency.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- roadmap Submodule -->
							<details>
								<summary><b>roadmap</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.components.roadmap</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/roadmap/Safe3DViewer.tsx'>Safe3DViewer.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a visual component for exploring a skill development roadmap, supporting both 2D and 3D views<br>- It manages rendering logic based on user preferences or system constraints, enabling interactive navigation through skill nodes<br>- Serves as a key element in the architecture for visualizing progress and relationships within the broader skill-tracking application.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/roadmap/SkillTree2DFallback.tsx'>SkillTree2DFallback.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a visual fallback component for the 2D skill tree visualization within the application<br>- It ensures a graceful display when the 2D rendering is unavailable or loading, maintaining user interface consistency and conveying the fallback reason through accessible labels<br>- This component supports the overall architecture by enhancing resilience and user experience during rendering issues.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- tools Submodule -->
							<details>
								<summary><b>tools</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ src.app.components.tools</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/tools/PomodoroTimer.tsx'>PomodoroTimer.tsx</a></b></td>
											<td style='padding: 8px;'>- Implements a Pomodoro timer component that manages focus and break sessions, providing user controls for starting, pausing, resetting, and switching modes<br>- It synchronizes session state with a backend API when a session ID is provided, facilitating real-time updates and session tracking within the overall productivity application architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/components/tools/QuizContainer.tsx'>QuizContainer.tsx</a></b></td>
											<td style='padding: 8px;'>- QuizContainer.tsxThis component serves as the central orchestrator for the quiz experience within the application<br>- It manages the quiz lifecycle—from initiation, through active participation, to displaying results—by coordinating user interactions and quiz state transitions<br>- The component interfaces with backend quiz services to fetch questions, submit answers, and retrieve attempt results, ensuring a seamless and dynamic quiz flow<br>- It also handles access control, verifying if users have the necessary premium privileges to participate<br>- Overall, QuizContainer.tsx encapsulates the core logic for delivering an interactive, state-driven quiz feature aligned with the applications broader architecture.</td>
										</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
					<!-- contexts Submodule -->
					<details>
						<summary><b>contexts</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ src.app.contexts</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/contexts/PomodoroContext.tsx'>PomodoroContext.tsx</a></b></td>
									<td style='padding: 8px;'>- Implements a React context managing the Pomodoro timer, including session phases, countdown logic, and navigation safeguards<br>- Facilitates starting, pausing, resetting, and transitioning between focus and break periods while tracking study time and focus count<br>- Ensures uninterrupted learning sessions by blocking navigation outside designated safe paths during active timers, supporting a seamless focus-enhancing experience within the application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/src/app/contexts/AuthContext.tsx'>AuthContext.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized authentication management system within the application architecture, enabling seamless handling of user sessions across multiple tabs and page reloads<br>- Facilitates session hydration, persistence, and logout functionalities, ensuring consistent user authentication state throughout the app<br>- Acts as a core component for secure access control and user state management in the overall codebase.</td>
								</tr>
							</table>
						</blockquote>
					</details>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<!-- guidelines Submodule -->
	<details>
		<summary><b>guidelines</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ guidelines</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AnhKhoaa157/SkillSprint-FE/blob/master/guidelines/Guidelines.md'>Guidelines.md</a></b></td>
					<td style='padding: 8px;'>- Establishes comprehensive guidelines for maintaining consistent system and design standards across the project<br>- Facilitates clear communication of best practices, component usage, and layout principles to ensure cohesive development aligned with the companys design system<br>- Supports developers and designers in creating maintainable, user-friendly interfaces that adhere to established architectural and aesthetic conventions.</td>
				</tr>
			</table>
		</blockquote>
	</details>
</details>

---

## 🚀 Getting Started

### 📋 Prerequisites

This project requires the following dependencies:

- **Programming Language:** TypeScript
- **Package Manager:** Npm

### ⚙️ Installation

Build SkillSprint-FE from the source and install dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/AnhKhoaa157/SkillSprint-FE
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd SkillSprint-FE
    ```

3. **Install the dependencies:**

**Using [npm](https://www.npmjs.com/):**

```sh
❯ npm install
```

### 💻 Usage

Run the project with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm start
```

### 🧪 Testing

Skillsprint-fe uses the {__test_framework__} test framework. Run the test suite with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm test
```

---

## 📈 Roadmap

- [X] **`Task 1`**: <strike>Implement feature one.</strike>
- [ ] **`Task 2`**: Implement feature two.
- [ ] **`Task 3`**: Implement feature three.

---

## 🤝 Contributing

- **💬 [Join the Discussions](https://github.com/AnhKhoaa157/SkillSprint-FE/discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://github.com/AnhKhoaa157/SkillSprint-FE/issues)**: Submit bugs found or log feature requests for the `SkillSprint-FE` project.
- **💡 [Submit Pull Requests](https://github.com/AnhKhoaa157/SkillSprint-FE/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone https://github.com/AnhKhoaa157/SkillSprint-FE
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to github**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!
</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://github.com{/AnhKhoaa157/SkillSprint-FE/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=AnhKhoaa157/SkillSprint-FE">
   </a>
</p>
</details>

---

<div align="left"><a href="#top">⬆ Return</a></div>

---
