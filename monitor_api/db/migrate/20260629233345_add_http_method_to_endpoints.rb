class AddHttpMethodToEndpoints < ActiveRecord::Migration[8.1]
  def change
    add_column :endpoints, :http_method, :string, default: 'GET', null: false
  end
end
