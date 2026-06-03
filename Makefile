.PHONY: run client api

run:
	@$(MAKE) -j2 client api

client:
	cd turn-one-client && npm run dev

api:
	cd turn-one-backend && dotnet run --project API
