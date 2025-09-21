# Olma Bratwurst

A prototype AI-powered personal finance management application that automatically categorizes bank transactions, provides spending insights, and offers conversational financial analysis powered by IBM watsonx.

Users have limited insight into their spending patterns and lack tools to detect meaningful trends in their financial history. Traditional banking apps provide basic transaction lists but fail to offer intelligent analysis and actionable insights.

## Features

### Core Functionality
- **Automatic Transaction Categorization** - Intelligently categorizes transactions (groceries, transport, leisure, etc.)
- **Retailer Recognition** - Automatically identifies and assigns retailer information to transactions
- **Conversational AI Interface** - Natural language queries about your finances powered by IBM watsonx
- **Visual Analytics** - Interactive charts and spending pattern visualizations
- **Recurring Payment Detection** - Identifies and tracks subscription services and recurring expenses

### AI-Powered Insights
- **Spending Analysis** - Analyze expenditure by category, merchant, location, and time period
- **Pattern Detection** - Identify unusual transactions and spending anomalies
- **Financial Recommendations** - AI-generated savings tips and optimization suggestions
- **Predictive Analytics** - Forecast recurring costs and seasonal spending patterns

### Data Management
- **Export Capabilities** - CSV/Excel export functionality
- **API Integration** - RESTful endpoints for banking system integration
- **Real-time Processing** - Live transaction analysis and categorization

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, PostgreSQL
- **AI Platform**: IBM watsonx (Granite models)
- **Charts**: Recharts, Chart.js
- **Maps**: Google Maps API
- **Database**: PostgreSQL with Prisma ORM

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- IBM Cloud account with watsonx access
- Google Maps API key (optional, for location features)

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database
PG_URI=postgresql://user:password@localhost:5432/finance_db

# IBM watsonx Configuration
WX_URL=https://eu-de.ml.cloud.ibm.com
WX_PROJECT_ID=your_watsonx_project_id
WX_MODEL_ID=ibm/granite-3-8b-instruct
IBM_CLOUD_API_KEY=your_ibm_cloud_api_key

# Optional: Direct IAM token for testing
IAM_TOKEN=your_iam_token

# Google Maps (optional)
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Server Configuration
PORT=5050
DEFAULT_LIMIT=200
```

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-finance-manager
   ```

2. **Install main application dependencies**
   ```bash
   npm install
   ```

3. **Install API server dependencies**
   ```bash
   cd app/tools_ai/api
   npm install
   cd ../../..
   ```

4. **Set up the database**
   - Create a PostgreSQL database
   - Import your transaction data into a `transactions` table
   - Ensure the table includes columns: `zeilen_nr`, `account_name`, `trx_id`, `trx_date`, `amount`, `amount_chf`, `creditor_name`, `category`, etc.

5. **Start the API server**
   ```bash
   cd app/tools_ai/api
   npm run dev
   ```

6. **Start the main application**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Web interface: http://localhost:3000
   - API server: http://localhost:5050

## 🎮 Usage Examples

### Conversational Queries
Ask natural language questions about your finances:

- "How much did I spend on groceries last month?"
- "What was my most expensive month in 2024?"
- "Show me all transactions from Swisscom"
- "What are my monthly recurring payments?"
- "How much did my summer vacation cost?"

### Command Line Interface
Use the CLI tool for direct queries:

```bash
cd app/tools_ai
node q2sql.mjs "total expenditure for 2024"
```

### API Endpoints

**POST** `/api/ask`
```json
{
  "question": "How much did I spend on transport last month?"
}
```

Response:
```json
{
  "summary": "You spent CHF 1,245.67 on transport last month...",
  "sql": "SELECT SUM(amount_chf) FROM transactions WHERE...",
  "rows": [...],
  "suggestions": [
    "How does this compare to previous months?",
    "What was my biggest transport expense?",
    "Show me all public transport vs car expenses"
  ]
}
```

## Supported Query Types

### 1. Recurring Transactions
- Find all invoices from specific merchants
- Calculate totals for recurring payments
- Track subscription services

### 2. Spending Analysis & Insights
- Holiday and vacation expense tracking
- Most/least expensive periods
- Expenditure by country/location
- ATM withdrawal patterns
- Fixed cost analysis

### 3. Comparisons & Optimization
- AI-generated savings recommendations
- Transport cost breakdown (car vs public transport)
- Anomaly detection
- Category suggestions
- Data export capabilities

## AI Integration

This application leverages **IBM watsonx** for:
- Natural language to SQL conversion
- Intelligent transaction summarization
- Financial insight generation
- Query suggestion recommendations

The AI uses IBM's Granite language models to understand financial queries and generate accurate SQL statements for data analysis.

## Security & Privacy

- Read-only database queries for safety
- SQL injection prevention through parameterized queries
- No sensitive data stored in the AI prompts
- Local data processing with secure IBM watsonx integration

## Development Status

This is a **prototype** application demonstrating AI-powered financial analysis capabilities. Key features implemented:

- Transaction visualization and categorization
- Natural language query processing
- Interactive charts and analytics
- IBM watsonx integration
- Recurring payment detection
- API endpoints for integration

## Contributing

This is a prototype project. For production use, consider additional security measures, error handling, and scalability improvements.
