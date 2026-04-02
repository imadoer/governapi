--
-- PostgreSQL database dump
--

\restrict dzFTCoSihylQBB6OhRe1Fnu3Q9PSnreb2z18fZ4lNUuxJvqyVMg7aQEFhM8zBpp

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: governapi_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO governapi_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blocked_ips; Type: TABLE; Schema: public; Owner: governapi_user
--

CREATE TABLE public.blocked_ips (
    ip character varying(45) NOT NULL,
    reason text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    duration_ms integer NOT NULL,
    threat_level character varying(20) DEFAULT 'MEDIUM'::character varying,
    threats jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.blocked_ips OWNER TO governapi_user;

--
-- Name: security_events; Type: TABLE; Schema: public; Owner: governapi_user
--

CREATE TABLE public.security_events (
    id integer NOT NULL,
    ip character varying(45) NOT NULL,
    event_type character varying(50) NOT NULL,
    threat_level character varying(20) NOT NULL,
    details jsonb,
    user_agent text,
    target_url text,
    blocked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.security_events OWNER TO governapi_user;

--
-- Name: security_events_id_seq; Type: SEQUENCE; Schema: public; Owner: governapi_user
--

CREATE SEQUENCE public.security_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_events_id_seq OWNER TO governapi_user;

--
-- Name: security_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: governapi_user
--

ALTER SEQUENCE public.security_events_id_seq OWNED BY public.security_events.id;


--
-- Name: security_events id; Type: DEFAULT; Schema: public; Owner: governapi_user
--

ALTER TABLE ONLY public.security_events ALTER COLUMN id SET DEFAULT nextval('public.security_events_id_seq'::regclass);


--
-- Data for Name: blocked_ips; Type: TABLE DATA; Schema: public; Owner: governapi_user
--

COPY public.blocked_ips (ip, reason, expires_at, created_at, duration_ms, threat_level, threats) FROM stdin;
fixed-test	Fixed connection test	2025-09-16 19:13:13.679	2025-09-16 19:08:13.705693	300000	HIGH	["FIXED_TEST"]
test-stats	Stats test	2025-09-17 05:51:13.505	2025-09-17 05:46:13.51523	300000	HIGH	["STATS_TEST"]
webhook-test	Direct webhook test	2025-09-17 05:58:10.726	2025-09-17 05:53:10.868595	300000	HIGH	["WEBHOOK_TEST"]
auth-test	Auth test	2025-09-17 09:13:48.634	2025-09-17 09:08:48.658868	300000	HIGH	["AUTH_TEST"]
test-ip-123	Threat detected: MALICIOUS_USER_AGENT	2025-09-17 09:29:38.001	2025-09-17 09:24:38.002881	300000	MEDIUM	["MALICIOUS_USER_AGENT"]
direct-test	Threat detected: MALICIOUS_USER_AGENT	2025-09-17 13:00:32.343	2025-09-17 12:55:32.345528	300000	MEDIUM	["MALICIOUS_USER_AGENT"]
209.97.174.248	Threat detected: MALICIOUS_USER_AGENT	2025-09-20 08:05:18.491	2025-09-20 08:00:18.492497	300000	MEDIUM	["MALICIOUS_USER_AGENT"]
\.


--
-- Data for Name: security_events; Type: TABLE DATA; Schema: public; Owner: governapi_user
--

COPY public.security_events (id, ip, event_type, threat_level, details, user_agent, target_url, blocked, created_at) FROM stdin;
1	fixed-test	THREAT_BLOCKED	HIGH	{"reason": "Fixed connection test", "threats": ["FIXED_TEST"], "duration": 300000}	\N	\N	t	2025-09-16 19:08:13.712011
2	209.97.174.248	THREAT_BLOCKED	MEDIUM	{"reason": "Threat detected: MALICIOUS_USER_AGENT", "threats": ["MALICIOUS_USER_AGENT"], "duration": 300000}	\N	\N	t	2025-09-16 19:18:24.565749
3	209.97.174.248	IP_UNBLOCKED	INFO	{"action": "manual_unblock"}	\N	\N	f	2025-09-17 05:45:34.218271
4	test-stats	THREAT_BLOCKED	HIGH	{"reason": "Stats test", "threats": ["STATS_TEST"], "duration": 300000}	\N	\N	t	2025-09-17 05:46:13.517597
5	webhook-test	THREAT_BLOCKED	HIGH	{"reason": "Direct webhook test", "threats": ["WEBHOOK_TEST"], "duration": 300000}	\N	\N	t	2025-09-17 05:53:10.872763
6	auth-test	THREAT_BLOCKED	HIGH	{"reason": "Auth test", "threats": ["AUTH_TEST"], "duration": 300000}	\N	\N	t	2025-09-17 09:08:48.66785
7	209.97.174.248	THREAT_BLOCKED	MEDIUM	{"reason": "Threat detected: MALICIOUS_USER_AGENT", "threats": ["MALICIOUS_USER_AGENT"], "duration": 300000}	\N	\N	t	2025-09-17 09:20:25.880423
8	test-ip-123	THREAT_BLOCKED	MEDIUM	{"reason": "Threat detected: MALICIOUS_USER_AGENT", "threats": ["MALICIOUS_USER_AGENT"], "duration": 300000}	\N	\N	t	2025-09-17 09:24:38.006876
9	fresh-test-ip	THREAT_BLOCKED	MEDIUM	{"reason": "Threat detected: MALICIOUS_USER_AGENT", "threats": ["MALICIOUS_USER_AGENT"], "duration": 300000}	\N	\N	t	2025-09-17 09:31:44.590732
10	fresh-test-ip	IP_UNBLOCKED	INFO	{"action": "manual_unblock"}	\N	\N	f	2025-09-17 09:32:53.046024
11	fresh-test-ip	IP_UNBLOCKED	INFO	{"action": "manual_unblock"}	\N	\N	f	2025-09-17 09:32:53.098627
12	direct-test	THREAT_BLOCKED	MEDIUM	{"reason": "Threat detected: MALICIOUS_USER_AGENT", "threats": ["MALICIOUS_USER_AGENT"], "duration": 300000}	\N	\N	t	2025-09-17 12:55:32.347857
13	209.97.174.248	THREAT_BLOCKED	MEDIUM	{"reason": "Threat detected: MALICIOUS_USER_AGENT", "threats": ["MALICIOUS_USER_AGENT"], "duration": 300000}	\N	\N	t	2025-09-17 12:55:41.927237
14	209.97.174.248	THREAT_BLOCKED	MEDIUM	{"reason": "Threat detected: MALICIOUS_USER_AGENT", "threats": ["MALICIOUS_USER_AGENT"], "duration": 300000}	\N	\N	t	2025-09-20 08:00:18.496939
\.


--
-- Name: security_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: governapi_user
--

SELECT pg_catalog.setval('public.security_events_id_seq', 14, true);


--
-- Name: blocked_ips blocked_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: governapi_user
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_pkey PRIMARY KEY (ip);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: governapi_user
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: idx_blocked_ips_expires; Type: INDEX; Schema: public; Owner: governapi_user
--

CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips USING btree (expires_at);


--
-- Name: idx_security_events_created; Type: INDEX; Schema: public; Owner: governapi_user
--

CREATE INDEX idx_security_events_created ON public.security_events USING btree (created_at);


--
-- PostgreSQL database dump complete
--

\unrestrict dzFTCoSihylQBB6OhRe1Fnu3Q9PSnreb2z18fZ4lNUuxJvqyVMg7aQEFhM8zBpp

