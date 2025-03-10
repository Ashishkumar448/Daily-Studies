# HTTP Overview

## Introduction
- HTTP (Hypertext Transfer Protocol) is an application-level software protocol.
- It was designed for distributed, collaborative, and hypermedia information systems.
- HTTP has been in worldwide use since 1990.

---

## HTTP 0.9 & 1.0

### HTTP 0.9
- The first version of HTTP is referred to as HTTP 0.9.
- It was a simple protocol for raw data transfer.
- Later improvements allowed messages to be formatted similar to MIME messages.
- These messages included meta-information about transferred data and request/response semantics.

#### Disadvantages of HTTP 0.9
- Did not consider hierarchical proxies, caching needs, persistent connections, or virtual hosts.
- Many applications claimed to support HTTP 1.0 but did not fully implement all features, making interoperability between applications difficult.

### HTTP 1.1

**Note:** Practical information systems require more functionality than simple retrieval, including search, front-end updates, and annotations.

- HTTP 1.1 included more stringent requirements than HTTP 1.0 to ensure reliable implementation of its features.
- It allows an open-ended set of methods and headers to indicate the purpose of a request.
- Built on the rule of reference provided by URL, URI, and URN.
- Messages are passed in a format similar to Internet mail, as defined by Multipurpose Internet Mail Extensions (MIME).
- Used as a generic protocol for communication between user agents and proxies/gateways to other systems:
  - Includes SMTP, NNTP, FTP, Gopher, WAIS.
- HTTP allows basic hypermedia access to resources available from diverse applications.

---

## Requirements

### Terminology in HTTP Requirements

The following words have specific meanings in HTTP documentation:

- **MUST / REQUIRED / SHALL**: Something that is necessary; you have to do it.
- **MUST NOT / SHALL NOT**: Something that is not allowed; you must avoid it.
- **SHOULD / RECOMMENDED**: Something that is suggested; a good idea but not strictly required.
- **SHOULD NOT**: Something that is suggested to avoid but not strictly forbidden.
- **MAY / OPTIONAL**: Something that you can choose to do or not do; it’s up to you.

### Compliance with Requirements

- An implementation **is not compliant** if it fails to meet any of the MUST or REQUIRED conditions.
- An implementation is **unconditionally compliant** if it meets all the MUST/REQUIRED and SHOULD conditions.
- An implementation is **conditionally compliant** if it meets all the MUST/REQUIRED conditions but does not meet all the SHOULD conditions.
