# Documentation: lead.types.ts

**Fichier:** `src/types/lead.types.ts`

## Types (3)

### export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'unqualified';
**Ligne:** 9
**JSDoc:** ❌

### export type LeadSource = 'google_maps' | 'website' | 'social_media' | 'referral' | 'cold_outreach' | 'event' | 'other';
**Ligne:** 14
**JSDoc:** ❌

### export type LeadCategory = 'restaurant' | 'salon' | 'coach' | 'retail' | 'service' | 'healthcare' | 'education' | 'other';
**Ligne:** 19
**JSDoc:** ❌

## Interfaces (18)

### export interface Lead {
**Ligne:** 24
**JSDoc:** ❌

### export interface SocialMediaHandles {
**Ligne:** 92
**JSDoc:** ❌

### export interface LeadMetrics {
**Ligne:** 115
**JSDoc:** ❌

### export interface LeadMetadata {
**Ligne:** 144
**JSDoc:** ❌

### export interface LeadInteraction {
**Ligne:** 167
**JSDoc:** ❌

### export interface CommunicationPreferences {
**Ligne:** 190
**JSDoc:** ❌

### export interface Demographics {
**Ligne:** 210
**JSDoc:** ❌

### export interface CreateLeadData {
**Ligne:** 236
**JSDoc:** ❌

### export interface UpdateLeadData extends Partial<CreateLeadData> {
**Ligne:** 286
**JSDoc:** ❌

### export interface LeadFilters {
**Ligne:** 303
**JSDoc:** ❌

### export interface LeadSearchParams extends LeadFilters {
**Ligne:** 347
**JSDoc:** ❌

### export interface LeadSearchResult {
**Ligne:** 364
**JSDoc:** ❌

### export interface LeadStats {
**Ligne:** 390
**JSDoc:** ❌

### export interface LeadImportData {
**Ligne:** 425
**JSDoc:** ❌

### export interface LeadImportResult {
**Ligne:** 448
**JSDoc:** ❌

### export interface ImportError {
**Ligne:** 468
**JSDoc:** ❌

### export interface LeadExportData {
**Ligne:** 485
**JSDoc:** ❌

### export interface LeadExportResult {
**Ligne:** 505
**JSDoc:** ❌

