# HTTP Overview
HTTP (Hypertext Transfer Protocol) is the foundation of data communication for the World Wide Web. It is a client-server protocol used for exchanging resources such as HTML documents.

## Key Components of HTTP

### 1. Connections
- **Definition**: A transport layer virtual circuit established between two programs for the purpose of communication.
- **Purpose**: Enables data exchange between a client and a server.

### 2. Messages
- **Definition**: The basic unit of HTTP communication, consisting of a structured sequence of octets transmitted via connections.
- **Types**: Messages can be either requests or responses.

### 3. Request
- **Definition**: An HTTP request message sent by a client to a server.
- **Components**: Includes a method (e.g., GET, POST), URL, headers, and an optional body.

### 4. Response
- **Definition**: An HTTP response message sent by a server to a client.
- **Components**: Includes a status code, headers, and an optional body.

### 5. Resource
- **Definition**: A network data object or service identified by a URI.
- **Characteristics**:
  - Available in multiple languages, data formats, sizes, and resolutions.
  - May vary in other ways.

### 6. Entity
- **Definition**: The information transferred as the payload of a request or response.
- **Components**:
  - **Metainformation**: Entity-header fields.
  - **Content**: Entity-body.

### 7. Representation
- **Definition**: An entity included with a response that is subject to content negotiation.
- **Characteristics**: Multiple representations may exist for a particular response status.

### 8. Content Negotiation
- **Definition**: The mechanism for selecting the appropriate representation when servicing a request.
- **Scope**: Applies to all responses, including error responses.

### 9. Variant
- **Definition**: A resource may have one or more representations associated with it.
- **Note**: The term "variant" does not imply content negotiation.

### 10. Client
- **Definition**: A program that establishes connections to send requests.
- **Examples**: Web browsers, mobile apps.

### 11. User Agent
- **Definition**: The client that initiates a request.
- **Examples**: Browsers, editors, spiders.

### 12. Server
- **Definition**: An application that accepts connections to service requests.
- **Roles**: Can act as an origin server, proxy, gateway, or tunnel.

### 13. Origin Server
- **Definition**: The server where a resource resides or is created.

### 14. Proxy
- **Definition**: An intermediary acting as both a server and a client.
- **Types**: Transparent or non-transparent.

### 15. Gateway
- **Definition**: A server acting as an intermediary for another server.
- **Characteristics**: Receives requests as if it were the origin server.

### 16. Tunnel
- **Definition**: An intermediary program acting as a blind relay between connections.
- **Characteristics**: Not considered a party to HTTP communication once active.

### 17. Cache
- **Definition**: A local store of response messages.
- **Purpose**: Reduces response time and network bandwidth consumption.

### 18. Cacheable
- **Definition**: A response that can be stored by a cache for future requests.
- **Rules**: Defined in HTTP specifications.

### 19. First-hand
- **Definition**: A response coming directly from the origin server without unnecessary delay.

### 20. Explicit Expiration Time
- **Definition**: The time when an entity should no longer be returned by a cache without validation.

### 21. Heuristic Expiration Time
- **Definition**: An expiration time assigned by a cache when no explicit time is available.

### 22. Age
- **Definition**: The time since a response was sent or validated with the origin server.

### 23. Freshness Lifetime
- **Definition**: The time between response generation and expiration.

### 24. Fresh
- **Definition**: A response whose age has not exceeded its freshness lifetime.

### 25. Stale
- **Definition**: A response whose age has passed its freshness lifetime.

### 26. Semantically Transparent
- **Definition**: A cache that improves performance without affecting the client or origin server.

### 27. Validator
- **Definition**: A protocol element (e.g., entity tag or Last-Modified time) used to check cache entry validity.

### 28. Upstream/Downstream
- **Definition**: Describes message flow from upstream to downstream.

### 29. Inbound/Outbound
- **Definition**: Inbound messages travel toward the origin server; outbound messages travel toward the user agent.
