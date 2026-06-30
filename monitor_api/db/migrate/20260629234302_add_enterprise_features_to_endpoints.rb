class AddEnterpriseFeaturesToEndpoints < ActiveRecord::Migration[8.1]
  def change
    add_column :endpoints, :expected_status, :integer, default: 200, null: false
    add_column :endpoints, :custom_headers, :jsonb, default: {}, null: false
    add_column :endpoints, :environment, :string, default: 'Production', null: false
  end
end
