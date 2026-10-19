CREATE TABLE "quote_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_shares_quote_id_unique" UNIQUE("quote_id"),
	CONSTRAINT "quote_shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"client_name" text,
	"client_email" text,
	"client_address" text,
	"freelancer_name" text NOT NULL,
	"freelancer_title" text,
	"freelancer_email" text,
	"freelancer_phone" text,
	"hourly_rate" integer NOT NULL,
	"hours_per_day" integer DEFAULT 8 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"tasks" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"terms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_shares" ADD CONSTRAINT "quote_shares_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotes_owner_id_idx" ON "quotes" USING btree ("owner_id");