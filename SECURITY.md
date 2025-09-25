# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do not** create a public issue
2. Email security@turnone.com with details
3. Include steps to reproduce if possible
4. Allow up to 72 hours for initial response

## Security Measures

This project implements:

- Automated security scanning with Trivy
- Dependency vulnerability checks
- Code quality analysis with SonarCloud
- Container security best practices
- Non-root container execution
- Regular dependency updates via Dependabot

## Response Timeline

- Initial response: 72 hours
- Vulnerability assessment: 1 week
- Fix deployment: 2 weeks (critical), 1 month (high), 3 months (medium/low)